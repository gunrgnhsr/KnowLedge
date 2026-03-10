"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/db/api";
import { Problem, ReviewGrade, Topic, Concept } from "@/lib/db/models";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Check, X, Brain, Lightbulb, BookOpen, Loader2 } from "lucide-react";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { ConceptPopup } from "@/components/knowledge/ConceptPopup";
import { cn } from "@/lib/utils";

export default function SolveProblem() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [problem, setProblem] = useState<Problem | null>(null);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [concepts, setConcepts] = useState<Concept[]>([]);
    const [showAnswer, setShowAnswer] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [activeConcept, setActiveConcept] = useState<Concept | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const [item, allTopics, allItems] = await Promise.all([
                    api.items.getById(id),
                    api.topics.list(),
                    api.items.list()
                ]);

                if (item && item.type === "problem") {
                    setProblem(item);
                } else {
                    router.push("/problems");
                }

                setTopics(allTopics);
                setConcepts(allItems.filter((i): i is Concept => i.type === "concept"));
            } catch (err) {
                console.error(err);
                router.push("/problems");
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [id, router]);

    const handleGrade = async (grade: ReviewGrade) => {
        if (!problem) return;
        await api.items.reviewItem(problem.id, grade);
        router.push("/problems");
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Loading problem...</p>
            </div>
        );
    }

    if (!problem) return null;

    return (
        <div className="container mx-auto py-6 px-4 md:px-6 max-w-3xl flex flex-col h-[calc(100vh-4rem)]">
            <div className="flex items-center justify-between mb-8">
                <Link href="/problems">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-2">
                        Practice Mode
                    </span>
                    <div className="flex gap-1">
                        {(problem.topicIds || []).map(tid => {
                            const topic = topics.find(t => t.id === tid);
                            if (!topic) return null;
                            return (
                                <Badge
                                    key={tid}
                                    variant="outline"
                                    className="text-[10px] uppercase font-bold py-0 h-4 border-none"
                                    style={{ backgroundColor: topic.color + '15', color: topic.color }}
                                >
                                    {topic.name}
                                </Badge>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col space-y-6">
                <Card className="flex-1 overflow-hidden flex flex-col border-primary/20 shadow-xl shadow-primary/5">
                    <div className="bg-muted/50 px-6 py-3 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Brain className="w-4 h-4 text-primary opacity-60" />
                            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                Problem Challenge
                            </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold opacity-50">
                            Interval: {problem.interval}d
                        </span>
                    </div>

                    <CardContent className="p-8 md:p-12 overflow-y-auto flex-1">
                        <div className="prose dark:prose-invert max-w-none text-lg text-foreground prose-p:my-2 prose-pre:bg-muted prose-pre:text-foreground">
                            <MarkdownRenderer content={problem.question} />

                            {problem.hints && problem.hints.length > 0 && !showAnswer && (
                                <div className="mt-8">
                                    {!showHint ? (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-950/20"
                                            onClick={() => setShowHint(true)}
                                        >
                                            <Lightbulb className="w-4 h-4 mr-2" />
                                            Need a hint? ({problem.hints.length})
                                        </Button>
                                    ) : (
                                        <div className="bg-yellow-50 dark:bg-yellow-950/10 border border-yellow-200 dark:border-yellow-900/30 p-4 rounded-lg animate-in zoom-in-95 duration-200 shadow-sm shadow-yellow-200/20">
                                            <div className="flex items-center gap-2 mb-3 text-yellow-700 dark:text-yellow-500 font-semibold text-sm">
                                                <Lightbulb className="w-4 h-4" />
                                                Hints Available
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {problem.hints.map(hintId => {
                                                    const concept = concepts.find(c => c.id === hintId);
                                                    return (
                                                        <Badge
                                                            key={`hint-${hintId}`}
                                                            variant="outline"
                                                            className="border-primary/30 text-primary bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors"
                                                            onClick={() => concept && setActiveConcept(concept)}
                                                        >
                                                            <BookOpen className="w-3 h-3 mr-1 opacity-60" />
                                                            {concept?.title || "Related Concept"}
                                                        </Badge>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {showAnswer && (
                            <div className="mt-12 pt-8 border-t border-border animate-in fade-in slide-in-from-bottom-4">
                                <div className="prose dark:prose-invert max-w-none text-foreground prose-p:my-2 prose-pre:bg-muted prose-pre:text-foreground">
                                    <MarkdownRenderer content={problem.solution} />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="h-24 flex items-center justify-center shrink-0 pb-8">
                    {!showAnswer ? (
                        <Button
                            size="lg"
                            className="w-full max-w-sm rounded-full h-14 text-lg shadow-lg hover:scale-105 transition-transform"
                            onClick={() => setShowAnswer(true)}
                        >
                            <Brain className="w-5 h-5 mr-2" />
                            Reveal Solution
                        </Button>
                    ) : (
                        <div className="grid grid-cols-4 gap-2 w-full animate-in zoom-in-95">
                            <Button
                                variant="destructive"
                                className="h-16 flex flex-col gap-1 rounded-2xl"
                                onClick={() => handleGrade(1)}
                            >
                                <X className="w-4 h-4" />
                                <span className="text-xs">Again</span>
                            </Button>
                            <Button
                                variant="secondary"
                                className="h-16 flex flex-col gap-1 border border-border rounded-2xl"
                                onClick={() => handleGrade(3)}
                            >
                                <span className="font-bold">Hard</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-16 flex flex-col gap-1 bg-green-500/10 text-green-600 border-none hover:bg-green-500/20 hover:text-green-700 dark:text-green-400 rounded-2xl"
                                onClick={() => handleGrade(4)}
                            >
                                <span className="font-bold">Good</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-16 flex flex-col gap-1 bg-blue-500/10 text-blue-600 border-none hover:bg-blue-500/20 hover:text-blue-700 dark:text-blue-400 rounded-2xl"
                                onClick={() => handleGrade(5)}
                            >
                                <span className="font-bold">Easy</span>
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <ConceptPopup
                concept={activeConcept}
                onClose={() => setActiveConcept(null)}
            />
        </div>
    );
}
