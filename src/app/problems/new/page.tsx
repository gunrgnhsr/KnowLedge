"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/db/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MarkdownEditor } from "@/components/editor/RichTextEditor";
import { ArrowLeft, Tags } from "lucide-react";
import Link from "next/link";
import { TopicSelector } from "@/components/topics/TopicSelector";
import { HintSelector } from "@/components/topics/HintSelector";

export default function NewProblem() {
    return (
        <Suspense fallback={<div>Loading editor...</div>}>
            <NewProblemContent />
        </Suspense>
    );
}

function NewProblemContent() {
    const router = useRouter();
    const [question, setQuestion] = useState("");
    const [solution, setSolution] = useState("");
    const [topicIds, setTopicIds] = useState<string[]>([]);
    const [hints, setHints] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // AI Suggestions State
    const [aiExistingIds, setAiExistingIds] = useState<string[]>([]);
    const [aiNewConcepts, setAiNewConcepts] = useState<{ title: string; content: string }[]>([]);
    const [existingConceptData, setExistingConceptData] = useState<Record<string, string>>({});

    const searchParams = useSearchParams();

    useEffect(() => {
        const importTrigger = searchParams.get("import");
        if (importTrigger === "ai") {
            const storedData = sessionStorage.getItem("ai_import_data");
            if (storedData) {
                try {
                    const parsed = JSON.parse(storedData);
                    if (parsed.question) setQuestion(parsed.question);
                    if (parsed.solution) setSolution(parsed.solution);
                    if (parsed.existingConceptIds) setAiExistingIds(parsed.existingConceptIds);
                    if (parsed.newConcepts) setAiNewConcepts(parsed.newConcepts);

                    // Note: we don't clear it yet because we might need it if the user refreshes
                    // or we can clear it and rely on state
                    sessionStorage.removeItem("ai_import_data");
                } catch (err) {
                    console.error("Failed to parse AI import data", err);
                }
            }
        }
    }, [searchParams]);

    // Fetch names for existing concept IDs
    useEffect(() => {
        const fetchConceptNames = async () => {
            if (aiExistingIds.length === 0) return;
            try {
                const newData: Record<string, string> = { ...existingConceptData };
                for (const id of aiExistingIds) {
                    if (!newData[id]) {
                        const item = await api.items.getById(id);
                        if (item && item.type === "concept") {
                            newData[id] = item.title;
                        }
                    }
                }
                setExistingConceptData(newData);
            } catch (err) {
                console.error("Failed to fetch concept names", err);
            }
        };
        fetchConceptNames();
    }, [aiExistingIds]);

    const handleApplyExistingConcept = (id: string) => {
        if (!hints.includes(id)) {
            setHints([...hints, id]);
        }
        setAiExistingIds(prev => prev.filter(i => i !== id));
    };

    const handleCreateNewConcept = async (concept: { title: string; content: string }) => {
        try {
            const newConcept = await api.items.createConcept({
                title: concept.title,
                content: concept.content || `Concept created from AI suggestion for problem: ${question.substring(0, 50)}...`,
                topicIds: topicIds
            });
            setHints([...hints, newConcept.id]);
            setAiNewConcepts(prev => prev.filter(c => c.title !== concept.title));
        } catch (err) {
            console.error("Failed to create concept", err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim() || !solution.trim()) return;

        setIsSubmitting(true);
        try {
            await api.items.createProblem({
                question,
                solution,
                topicIds,
                hints,
            });
            router.push("/problems");
        } catch (err) {
            console.error(err);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto py-10 px-4 md:px-6 max-w-4xl space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/problems">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">New Problem</h1>
            </div>

            {(aiExistingIds.length > 0 || aiNewConcepts.length > 0) && (
                <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-2 text-primary">
                        <ArrowLeft className="w-5 h-5 rotate-180" />
                        <h2 className="text-sm font-bold uppercase tracking-wider">AI Concept Suggestions</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {aiExistingIds.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground">Link Existing Concepts</Label>
                                <div className="flex flex-wrap gap-2">
                                    {aiExistingIds.map(id => (
                                        <div key={id} className="flex items-center gap-2 bg-background border border-border rounded-lg p-2 pl-3 group transition-all hover:border-primary/30">
                                            <span className="text-sm font-medium">{existingConceptData[id] || "Loading..."}</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 px-2 text-primary hover:bg-primary/10"
                                                onClick={() => handleApplyExistingConcept(id)}
                                            >
                                                Add Hint
                                            </Button>
                                            <button
                                                className="h-7 px-2 text-muted-foreground hover:text-destructive transition-colors"
                                                onClick={() => setAiExistingIds(prev => prev.filter(i => i !== id))}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {aiNewConcepts.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground">New Concepts to Create</Label>
                                <div className="flex flex-wrap gap-2">
                                    {aiNewConcepts.map(c => (
                                        <div key={c.title} className="flex flex-col gap-2 bg-background border border-border rounded-lg p-3 group transition-all hover:border-primary/30 min-w-[240px]">
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-sm font-bold italic">"{c.title}"</span>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 px-2 border-primary/20 text-primary hover:bg-primary/10"
                                                        onClick={() => handleCreateNewConcept(c)}
                                                    >
                                                        Create & Link
                                                    </Button>
                                                    <button
                                                        className="h-7 px-2 text-muted-foreground hover:text-destructive transition-colors"
                                                        onClick={() => setAiNewConcepts(prev => prev.filter(nc => nc.title !== c.title))}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground line-clamp-2 border-t pt-1 border-border/40">
                                                {c.content || "No explanation provided."}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-12">
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Label className="text-lg font-semibold">Topics</Label>
                        <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Tags className="w-3 h-3" />
                            Mandatory
                        </span>
                    </div>
                    <TopicSelector
                        selectedTopicIds={topicIds}
                        onTopicChange={setTopicIds}
                    />
                </div>

                <div className="space-y-3">
                    <HintSelector
                        parentTopicIds={topicIds}
                        selectedHintIds={hints}
                        onHintsChange={setHints}
                    />
                </div>

                <div className="space-y-2 flex flex-col h-[300px]">
                    <Label className="text-lg font-semibold">Question Prompt</Label>
                    <MarkdownEditor
                        content={question}
                        onChange={setQuestion}
                        placeholder="Write the question or problem statement here..."
                    />
                </div>

                <div className="space-y-2 flex flex-col h-[400px]">
                    <Label className="text-lg font-semibold">Solution Step-by-Step</Label>
                    <MarkdownEditor
                        content={solution}
                        onChange={setSolution}
                        placeholder="Provide the complete solution and any necessary explanations..."
                    />
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-border">
                    <Link href="/problems">
                        <Button type="button" variant="outline" size="lg">Cancel</Button>
                    </Link>
                    <Button type="submit" size="lg" disabled={isSubmitting || !question || !solution || topicIds.length === 0}>
                        {isSubmitting ? "Saving..." : "Save Problem"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
