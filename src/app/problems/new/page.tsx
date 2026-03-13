"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/db/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MarkdownEditor } from "@/components/editor/RichTextEditor";
import { Pencil, ArrowLeft, Tags } from "lucide-react";
import Link from "next/link";
import { TopicSelector } from "@/components/topics/TopicSelector";
import { HintSelector } from "@/components/topics/HintSelector";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AIImportModal } from "@/components/ai/AIImportModal";
import { AIGenerator } from "@/components/ai/AIGenerator";
import { Sparkles, Brain, Check as CheckIcon } from "lucide-react";

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
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);

    useEffect(() => {
        // No pre-fill needed for unified in-app flow
    }, []);

    // AI Suggestions State
    const [aiExistingIds, setAiExistingIds] = useState<string[]>([]);
    const [aiNewConcepts, setAiNewConcepts] = useState<{ title: string; content: string }[]>([]);
    const [editingNewConcept, setEditingNewConcept] = useState<{ index: number; title: string; content: string } | null>(null);
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
                    
                    if (parsed.existingConceptIds) {
                        let suggestions = parsed.existingConceptIds;
                        if (parsed.sourceConceptId) {
                            suggestions = suggestions.filter((id: string) => id !== parsed.sourceConceptId);
                        }
                        setAiExistingIds(suggestions);
                    }
                    if (parsed.newConcepts) setAiNewConcepts(parsed.newConcepts);
                    
                    // Auto-select topic if provided
                    if (parsed.sourceTopicIds && Array.isArray(parsed.sourceTopicIds)) {
                        setTopicIds(prev => [...new Set([...prev, ...parsed.sourceTopicIds])]);
                    }
                    
                    // Auto-add source concept as hint if provided
                    if (parsed.sourceConceptId) {
                        setHints(prev => [...new Set([...prev, parsed.sourceConceptId])]);
                    }

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
                        const concept = await api.concepts.getById(id);
                        if (concept) newData[id] = concept.title;
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

    const handleCreateNewConcept = async (concept: { title: string; content: string }, index?: number) => {
        try {
            const newConcept = await api.items.createConcept({
                title: concept.title,
                content: concept.content || `Concept created from AI suggestion for problem: ${question.substring(0, 50)}...`,
                topicIds: topicIds
            });
            setHints(prev => [...new Set([...prev, newConcept.id])]);
            if (index !== undefined) {
                setAiNewConcepts(prev => prev.filter((_, i) => i !== index));
            } else {
                setAiNewConcepts(prev => prev.filter(c => c.title !== concept.title));
            }
        } catch (err) {
            console.error("Failed to create concept", err);
        }
    };

    const handleUpdateSuggestedConcept = () => {
        if (!editingNewConcept) return;
        const newConcepts = [...aiNewConcepts];
        newConcepts[editingNewConcept.index] = {
            title: editingNewConcept.title,
            content: editingNewConcept.content
        };
        setAiNewConcepts(newConcepts);
        setEditingNewConcept(null);
    };

    const handleAIGenerated = (data: { question: string; solution: string; newConcepts?: { title: string; content: string }[] }) => {
        setQuestion(data.question);
        setSolution(data.solution);
        if (data.newConcepts) {
            setAiNewConcepts(data.newConcepts);
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
            const returnTo = searchParams.get("returnTo");
            if (returnTo) {
                router.push(returnTo);
            } else {
                router.push("/problems");
            }
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
                <div className="ml-auto flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAIModalOpen(true)}
                        className="gap-2 border-primary/20 hover:bg-primary/5"
                    >
                        <Sparkles className="w-4 h-4 text-primary" />
                        Import JSON
                    </Button>
                    <Button
                        type="button"
                        onClick={() => setIsAIGeneratorOpen(true)}
                        className="gap-2 bg-primary/10 text-primary hover:bg-primary/20 border-none shadow-none"
                    >
                        <Brain className="w-4 h-4 text-primary" />
                        Generate with Gemini
                    </Button>
                </div>
            </div>

            <AIImportModal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} />
            <AIGenerator
                isOpen={isAIGeneratorOpen}
                onClose={() => setIsAIGeneratorOpen(false)}
                onGenerated={handleAIGenerated}
            />

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
                                    {aiNewConcepts.map((c, index) => (
                                        <div key={index} className="flex flex-col gap-2 bg-background border border-border rounded-lg p-3 group transition-all hover:border-primary/30 min-w-[240px]">
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-sm font-bold italic">"{c.title}"</span>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 px-2 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                                        onClick={() => setEditingNewConcept({ index, title: c.title, content: c.content })}
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 px-2 border-primary/20 text-primary hover:bg-primary/10"
                                                        onClick={() => handleCreateNewConcept(c, index)}
                                                    >
                                                        Create & Link
                                                    </Button>
                                                    <button
                                                        className="h-7 px-2 text-muted-foreground hover:text-destructive transition-colors"
                                                        onClick={() => setAiNewConcepts(prev => prev.filter((_, i) => i !== index))}
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

            <Dialog open={!!editingNewConcept} onOpenChange={() => setEditingNewConcept(null)}>
                <DialogContent className="max-w-2xl rounded-3xl border border-primary/10 shadow-2xl">
                    <DialogHeader className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary text-primary-foreground">
                                <Pencil className="w-5 h-5" />
                            </div>
                            <DialogTitle className="text-2xl font-black tracking-tight">Edit Suggested Concept</DialogTitle>
                        </div>
                        <DialogDescription className="text-base text-muted-foreground font-medium">
                            Refine the AI suggestion before creating it as a permanent concept.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6 space-y-6">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-2 text-primary">Concept Title</Label>
                            <Input
                                value={editingNewConcept?.title || ""}
                                onChange={(e) => setEditingNewConcept(prev => prev ? { ...prev, title: e.target.value } : null)}
                                className="font-bold text-lg bg-muted/20 border-primary/5 h-12 rounded-xl focus-visible:ring-primary/20"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-2 text-primary">Content (Markdown/LaTeX)</Label>
                            <div className="h-[300px] border border-primary/5 rounded-2xl overflow-hidden shadow-inner">
                                <MarkdownEditor
                                    content={editingNewConcept?.content || ""}
                                    onChange={(val) => setEditingNewConcept(prev => prev ? { ...prev, content: val } : null)}
                                    placeholder="Define the concept using LaTeX ($\dots$)..."
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="gap-3">
                        <Button variant="ghost" onClick={() => setEditingNewConcept(null)} className="rounded-xl px-6">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdateSuggestedConcept}
                            className="rounded-xl px-8 gap-3 bg-primary hover:bg-primary/95 text-primary-foreground font-bold"
                        >
                            Update Suggestion
                            <CheckIcon className="w-4 h-4" />
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
