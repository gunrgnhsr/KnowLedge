"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/db/api";
import { StudyItem, ReviewGrade, Topic, Concept, Problem } from "@/lib/db/models";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Check, X, HelpCircle, Brain, Lightbulb, BookOpen, Target, GraduationCap, ChevronLeft, ChevronRight } from "lucide-react";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { ConceptPopup } from "@/components/knowledge/ConceptPopup";
import { TikZ } from "@/components/ui/TikZ";
import { cn } from "@/lib/utils";

function ExamContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Exam Config
    const conceptId = searchParams.get("conceptId");
    const topicId = searchParams.get("topicId");
    const problemIdsParam = searchParams.get("problemIds");
    const limit = parseInt(searchParams.get("count") || "10");
    const isPractice = searchParams.get("practice") === "true";
    const coverageMode = searchParams.get("coverage") === "true";

    // Session State
    const [queue, setQueue] = useState<StudyItem[]>([]);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [allConcepts, setAllConcepts] = useState<Concept[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [activeConcept, setActiveConcept] = useState<Concept | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function buildQueue() {
            setLoading(true);
            const [allItems, allTopics] = await Promise.all([
                api.items.list(),
                api.topics.list()
            ]);

            setTopics(allTopics);
            const concepts = allItems.filter((i): i is Concept => i.type === "concept");
            setAllConcepts(concepts);

            let pool: StudyItem[] = [];

            if (problemIdsParam) {
                const problemIds = problemIdsParam.split(",");
                const explicitProblems = allItems.filter((i): i is Problem =>
                    i.type === "problem" && problemIds.includes(i.id)
                );
                pool.push(...explicitProblems);
            } else if (conceptId) {
                const conceptIds = conceptId.split(",");
                // Focus on Concept(s): problems that hint at least one of these concepts
                const relatedProblems = allItems.filter((i): i is Problem =>
                    i.type === "problem" && i.hints.some(h => conceptIds.includes(h))
                );
                pool.push(...relatedProblems);
            } else if (topicId) {
                // Focus on Topic: only problems in this topic
                const topicItems = allItems.filter(i => i.topicIds.includes(topicId));
                const problems = topicItems.filter((i): i is Problem => i.type === "problem");

                if (coverageMode) {
                    // Optimized coverage: prioritize problems that cover different concepts first
                    const sortedProblems: Problem[] = [];
                    const coveredConcepts = new Set<string>();

                    let remaining = [...problems];
                    while (remaining.length > 0) {
                        // Find a problem that hits a new concept
                        let bestIdx = remaining.findIndex(p => p.hints.some(h => !coveredConcepts.has(h)));
                        if (bestIdx === -1) bestIdx = 0; // Just take next random

                        const p = remaining.splice(bestIdx, 1)[0];
                        sortedProblems.push(p);
                        p.hints.forEach(h => coveredConcepts.add(h));
                    }

                    pool.push(...sortedProblems);
                } else {
                    pool.push(...problems);
                }
            }

            // Shuffle and Limit
            const finalQueue = pool
                .sort(() => Math.random() - 0.5)
                .slice(0, limit);

            setQueue(finalQueue);
            setLoading(false);
        }
        buildQueue();
    }, [conceptId, topicId, limit, coverageMode]);

    const currentItem = queue[currentIndex];

    const handleGrade = async (grade: ReviewGrade) => {
        if (!currentItem) return;

        if (!isPractice) {
            await api.items.reviewItem(currentItem.id, grade);
        }

        resetSessionState();

        if (currentIndex < queue.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            router.push("/dashboard");
        }
    };

    const resetSessionState = () => {
        setShowAnswer(false);
        setShowHint(false);
    };

    const handleNavigate = (direction: 'prev' | 'next') => {
        resetSessionState();
        if (direction === 'prev') {
            setCurrentIndex(prev => Math.max(0, prev - 1));
        } else {
            setCurrentIndex(prev => Math.min(queue.length - 1, prev + 1));
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col h-screen items-center justify-center gap-4 bg-background">
                <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <p className="font-bold text-primary animate-pulse uppercase tracking-widest text-sm">Generating Exam...</p>
            </div>
        );
    }

    if (queue.length === 0) {
        return (
            <div className="flex h-[80vh] flex-col items-center justify-center space-y-4 px-6 text-center">
                <div className="p-6 rounded-full bg-muted text-muted-foreground mb-4">
                    <HelpCircle className="w-12 h-12" />
                </div>
                <h2 className="text-3xl font-black tracking-tight">Empty Exam</h2>
                <p className="text-xs text-muted-foreground mt-1">No questions found for this selection. Try adding some problems to this topic!</p>
                <Link href="/dashboard">
                    <Button variant="outline" className="mt-8 rounded-full px-10">Back to Safety</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-background min-h-screen">
            {/* Exam Header */}
            <div className="fixed top-0 left-0 w-full h-1.5 bg-muted z-50">
                <div
                    className="h-full bg-primary transition-all duration-500 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                    style={{ width: `${((currentIndex + 1) / queue.length) * 100}%` }}
                />
            </div>

            <div className="container mx-auto py-12 px-4 md:px-6 max-w-3xl flex flex-col h-screen">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground rounded-xl">
                                <ArrowLeft className="w-4 h-4" />
                                Exit Exam
                            </Button>
                        </Link>
                        <div className="flex flex-col">
                            <span className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-1.5 leading-none mb-1">
                                <Target className="w-3 h-3" /> Focused Exam
                            </span>
                            <div className="flex items-center gap-2">
                                {isPractice && (
                                    <Badge variant="secondary" className="bg-secondary/40 text-secondary-foreground border-none px-2 py-0 h-4 text-[9px] font-black uppercase tracking-tighter rounded-full">
                                        Practice
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-muted/50 p-1 rounded-xl border border-border shadow-sm">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg"
                            disabled={currentIndex === 0}
                            onClick={() => handleNavigate('prev')}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div className="flex flex-col items-center justify-center min-w-[3.5rem] px-2 border-x border-border/50">
                            <span className="text-[9px] font-black text-muted-foreground/50 leading-none mb-1 uppercase tracking-tighter">Item</span>
                            <span className="text-xs font-black text-foreground/80 leading-none">{currentIndex + 1} / {queue.length}</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg"
                            disabled={currentIndex === queue.length - 1}
                            onClick={() => handleNavigate('next')}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col space-y-6 overflow-hidden">
                    <Card className="flex-1 overflow-hidden flex flex-col border-border/40 shadow-xl shadow-black/5 bg-card">
                        <div className="bg-muted/30 px-6 py-4 border-b border-border/40 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-2 py-0.5 rounded border border-border/40">
                                    {currentItem.type}
                                </span>
                                <div className="flex gap-1">
                                    {(currentItem.topicIds || []).map(tid => {
                                        const topic = topics.find(t => t.id === tid);
                                        if (!topic) return null;
                                        return (
                                            <Badge
                                                key={tid}
                                                variant="outline"
                                                className="text-[10px] uppercase font-bold py-0 h-5 border-none px-2 rounded-full"
                                                style={{ backgroundColor: topic.color + '15', color: topic.color }}
                                            >
                                                {topic.name}
                                            </Badge>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <CardContent className="p-8 md:p-14 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-muted">
                            {currentItem.type === "concept" ? (
                                <div className="text-center space-y-8 py-10">
                                    <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                                        {currentItem.title}
                                    </h2>
                                    {!showAnswer && (
                                        <div className="flex justify-center mt-12 animate-pulse text-primary/10">
                                            <Brain className="w-24 h-24" />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="prose dark:prose-invert max-w-none prose-p:text-lg prose-p:leading-relaxed prose-p:text-foreground prose-pre:bg-muted/50 prose-headings:font-black">
                                    <MarkdownRenderer content={currentItem.question} />

                                    {currentItem.hints && currentItem.hints.length > 0 && !showAnswer && (
                                        <div className="mt-10 animate-in fade-in duration-500">
                                            {!showHint ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="rounded-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/20 font-bold px-4 h-9"
                                                    onClick={() => setShowHint(true)}
                                                >
                                                    <Lightbulb className="w-4 h-4 mr-2" />
                                                    View Related Concepts ({currentItem.hints.length})
                                                </Button>
                                            ) : (
                                                <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 p-5 rounded-2xl animate-in zoom-in-95 duration-200">
                                                    <div className="flex items-center gap-2 mb-3 text-blue-700 dark:text-blue-400 font-black text-xs uppercase tracking-widest">
                                                        <BookOpen className="w-3.5 h-3.5" /> Reference Materials
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {currentItem.hints.map(hintId => {
                                                            const concept = allConcepts.find(c => c.id === hintId);
                                                            return (
                                                                <Badge
                                                                    key={`hint-${hintId}`}
                                                                    variant="outline"
                                                                    className="border-primary/20 text-primary bg-background shadow-sm cursor-pointer hover:bg-primary/5 transition-all text-xs py-1 px-3 rounded-lg"
                                                                    onClick={() => concept && setActiveConcept(concept)}
                                                                >
                                                                    {concept?.title || "Concept"}
                                                                </Badge>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {showAnswer && (
                                <div className="mt-14 pt-10 border-t border-border/40 animate-in fade-in slide-in-from-bottom-8 duration-500">
                                    <div className="prose dark:prose-invert max-w-none prose-p:text-lg prose-pre:bg-muted/50 prose-pre:p-4 prose-pre:rounded-xl">
                                        <MarkdownRenderer content={currentItem.type === "concept" ? currentItem.content : currentItem.solution} />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Controls */}
                    <div className="h-28 flex items-center justify-center shrink-0">
                        {!showAnswer ? (
                            <Button
                                size="lg"
                                className="w-full max-w-md rounded-2xl h-16 text-xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all group"
                                onClick={() => setShowAnswer(true)}
                            >
                                <Brain className="w-6 h-6 mr-3 transition-transform group-hover:scale-110" />
                                Reveal Solution
                            </Button>
                        ) : (
                            <div className="grid grid-cols-4 gap-3 w-full animate-in zoom-in-95 duration-300">
                                <Button
                                    variant="outline"
                                    className="h-16 flex flex-col gap-1 rounded-2xl border-2 hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive group transition-all"
                                    onClick={() => handleGrade(1)}
                                >
                                    <X className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                                    <span className="text-[10px] font-black uppercase">Repeat</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-16 flex flex-col gap-1 rounded-2xl border-2 hover:bg-orange-500/10 hover:border-orange-500/30 hover:text-orange-600 transition-all"
                                    onClick={() => handleGrade(3)}
                                >
                                    <span className="font-black text-xs">HARD</span>
                                    <span className="text-[8px] font-bold opacity-60">STILL LEARNING</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-16 flex flex-col gap-1 rounded-2xl border-2 bg-green-500/5 text-green-600 border-green-500/20 hover:bg-green-500/10 hover:border-green-500/40 transition-all shadow-sm"
                                    onClick={() => handleGrade(4)}
                                >
                                    <span className="font-black text-xs uppercase">Good</span>
                                    <span className="text-[8px] font-bold opacity-60">MASTERED</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="h-16 flex flex-col gap-1 rounded-2xl border-2 bg-blue-500/5 text-blue-600 border-blue-500/20 hover:bg-blue-500/10 hover:border-blue-500/40 transition-all shadow-sm"
                                    onClick={() => handleGrade(5)}
                                >
                                    <span className="font-black text-xs uppercase text-blue-700">Perfect</span>
                                    <span className="text-[8px] font-bold opacity-60 uppercase">Too Easy</span>
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
        </div>
    );
}

export default function ExamPage() {
    return (
        <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading exam parameters...</div>}>
            <ExamContent />
        </Suspense>
    );
}
