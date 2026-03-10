"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/db/api";
import { Problem } from "@/lib/db/models";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MarkdownEditor } from "@/components/editor/RichTextEditor";
import { ArrowLeft, Loader2, Tags } from "lucide-react";
import Link from "next/link";
import { TopicSelector } from "@/components/topics/TopicSelector";
import { HintSelector } from "@/components/topics/HintSelector";

export default function EditProblem() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [question, setQuestion] = useState("");
    const [solution, setSolution] = useState("");
    const [topicIds, setTopicIds] = useState<string[]>([]);
    const [hints, setHints] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        async function loadData() {
            const item = await api.items.getById(id);
            if (item && item.type === "problem") {
                setQuestion(item.question);
                setSolution(item.solution);
                setTopicIds(item.topicIds || []);
                // Ensure hints are mapped to IDs if they come in the old format
                const hintIds = (item.hints || []).map((h: any) => typeof h === 'string' ? h : h.id);
                setHints(hintIds);
                setLoading(false);
            } else {
                router.push("/problems");
            }
        }
        loadData();
    }, [id, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!question.trim() || !solution.trim()) return;

        setIsSubmitting(true);
        try {
            await api.items.updateProblem(id, {
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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Loading problem data...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 px-4 md:px-6 max-w-4xl space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/problems">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">Edit Problem</h1>
            </div>

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
                        {isSubmitting ? "Saving..." : "Update Problem"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
