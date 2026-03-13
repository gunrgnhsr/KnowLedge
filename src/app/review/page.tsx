"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/db/api";
import { StudyItem, ReviewGrade, Topic, Concept, Problem } from "@/lib/db/models";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Check, X, HelpCircle, Brain, Lightbulb, BookOpen, Zap, PlusCircle, Search, ChevronLeft, ChevronRight, Edit } from "lucide-react";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { ConceptPopup } from "@/components/knowledge/ConceptPopup";
import { cn } from "@/lib/utils";
import { AIChoiceModal } from "@/components/ai/AIChoiceModal";
import { generateProblemFromContent } from "@/lib/ai/actions";
import { aiPrompts } from "@/lib/utils/ai-prompts";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles, Check as CheckIcon } from "lucide-react";

export default function ReviewSession() {
    const router = useRouter();
    const [queue, setQueue] = useState<StudyItem[]>([]);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [activeConcept, setActiveConcept] = useState<Concept | null>(null);
    const [allProblems, setAllProblems] = useState<Problem[]>([]);
    const [practiceProblem, setPracticeProblem] = useState<Problem | null>(null);
    const [practiceUI, setPracticeUI] = useState<'none' | 'selecting' | 'solving'>('none');
    const [showPracticeAnswer, setShowPracticeAnswer] = useState(false);
    const [loading, setLoading] = useState(true);
    const [aiModal, setAiModal] = useState<{ open: boolean; data: Concept | null }>({ open: false, data: null });
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);

    useEffect(() => {
        async function initSession() {
            // Try to restore session first
            const savedSession = sessionStorage.getItem("review_session");
            const [allTopics, allItems] = await Promise.all([
                api.topics.list(),
                api.items.list()
            ]);
            setTopics(allTopics);
            const problems = allItems.filter((i): i is Problem => i.type === "problem");
            setAllProblems(problems);

            if (savedSession) {
                try {
                    const parsed = JSON.parse(savedSession);
                    setQueue(parsed.queue);
                    setCurrentIndex(parsed.currentIndex);
                    sessionStorage.removeItem("review_session");
                    setLoading(false);
                    return;
                } catch (e) {
                    console.error("Failed to restore session", e);
                }
            }

            const due = await api.items.getDueItems();
            setQueue(due.filter((i): i is Concept => i.type === "concept"));
            setLoading(false);
        }
        initSession();
    }, []);

    // Unified AI Flow: Generate first, then redirect
    const handleAIChoiceInApp = async () => {
        if (!aiModal.data || !currentItem) return;
        setIsGeneratingAI(true);
        try {
            const concept = aiModal.data;
            const relatedConcepts = allProblems.filter(p => p.hints.includes(concept.id)); // Using allProblems to find related if needed, or just filter from all items if available
            // Note: Review session might not have all concepts loaded, but we have concepts in allProblems context or we can fetch.
            // For now, let's use what we have.
            const prompt = aiPrompts.generateFromConcept(concept, []);

            const data = await generateProblemFromContent(prompt);
            const enrichedData = {
                ...data,
                sourceTopicIds: concept.topicIds,
                sourceConceptId: concept.id
            };
            
            // Save review session to resume later
            sessionStorage.setItem("review_session", JSON.stringify({
                queue,
                currentIndex
            }));

            sessionStorage.setItem("ai_import_data", JSON.stringify(enrichedData));
            router.push("/problems/new?import=ai&returnTo=/review");
        } catch (err) {
            console.error("AI Generation Failed:", err);
        } finally {
            setIsGeneratingAI(false);
            setAiModal({ open: false, data: null });
        }
    };

    const handleAIChoiceCopyPrompt = () => {
        if (!aiModal.data) return;
        const concept = aiModal.data;
        const prompt = aiPrompts.generateFromConcept(concept, []);
        navigator.clipboard.writeText(prompt);
    };

    // Helper for easier access to current concept
    const currentItem = (queue && queue.length > 0 && currentIndex < queue.length)
        ? queue[currentIndex]
        : null;

    const handleGrade = async (grade: ReviewGrade, isPracticeProblem = false) => {
        const itemToGrade = isPracticeProblem ? practiceProblem : currentItem;
        if (!itemToGrade) return;

        await api.items.reviewItem(itemToGrade.id, grade);

        if (isPracticeProblem) {
            // After grading practice, return to concept
            setPracticeUI('none');
            setPracticeProblem(null);
            setShowPracticeAnswer(false);
        } else {
            resetReviewState();
            if (currentIndex < queue.length - 1) {
                setCurrentIndex(prev => prev + 1);
            } else {
                router.push("/dashboard");
            }
        }
    };

    const resetReviewState = () => {
        setShowAnswer(false);
        setShowHint(false);
        setPracticeUI('none');
        setPracticeProblem(null);
        setShowPracticeAnswer(false);
    };

    const handleNavigate = (direction: 'prev' | 'next') => {
        resetReviewState();
        if (direction === 'prev') {
            setCurrentIndex(prev => Math.max(0, prev - 1));
        } else {
            setCurrentIndex(prev => Math.min(queue.length - 1, prev + 1));
        }
    };

    const handleGetPractice = (type: 'new' | 'level', level?: number) => {
        if (!currentItem) return;
        const conceptId = currentItem.id;

        let eligible = allProblems.filter(p => p.hints.includes(conceptId));

        if (type === 'new') {
            eligible = eligible.filter(p => p.repetitions === 0);
        } else if (level !== undefined) {
            // Group 1-2-3 as "Hard/Again" if needed, but user said "by difficulty level"
            // Let's match exact grade if available
            eligible = eligible.filter(p => p.lastGrade === level);
        }

        if (eligible.length === 0) {
            // No matching problems found
            setAiModal({ open: true, data: currentItem as Concept });
            return;
        }

        const picked = eligible[Math.floor(Math.random() * eligible.length)];
        setPracticeProblem(picked);
        setPracticeUI('solving');
        setShowPracticeAnswer(false);
    };

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Loading session...</div>;
    }

    if (queue.length === 0 || currentIndex >= queue.length) {
        return (
            <div className="flex h-[80vh] flex-col items-center justify-center space-y-4">
                <div className="p-6 rounded-full bg-green-500/10 text-green-500 mb-4">
                    <Check className="w-12 h-12" />
                </div>
                <h2 className="text-3xl font-bold">You're all caught up!</h2>
                <p className="text-muted-foreground">No more items to review right now.</p>
                <Link href="/dashboard">
                    <Button variant="outline" className="mt-8">Return to Dashboard</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 px-4 md:px-6 max-w-3xl flex flex-col h-[calc(100vh-4rem)]">
            <div className="flex items-center justify-between mb-8">
                <Link href="/dashboard">
                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground rounded-xl">
                        <ArrowLeft className="w-4 h-4" />
                        Exit Session
                    </Button>
                </Link>

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
                    <div className="flex flex-col items-center justify-center min-w-[3rem] px-2 border-x border-border/50">
                        <span className="text-[9px] font-black text-muted-foreground/50 leading-none mb-1 uppercase tracking-tighter">Due</span>
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

            <div className="flex-1 flex flex-col space-y-6">
                <Card className="flex-1 overflow-hidden flex flex-col">
                    <div className="bg-muted px-6 py-3 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-2">
                                Concept Review
                            </span>
                            <div className="flex gap-1">
                                {(currentItem?.topicIds || []).map(tid => {
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
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2 text-[10px] font-black uppercase tracking-tighter text-primary hover:bg-primary/10 gap-1 rounded-lg"
                                onClick={() => {
                                    if (currentItem) {
                                        const route = currentItem.type === 'concept' ? 'knowledge' : 'problems';
                                        router.push(`/${route}/edit/${currentItem.id}`);
                                    }
                                }}
                            >
                                <Edit className="w-3 h-3" />
                                Edit
                            </Button>
                            {currentItem?.type === 'concept' && practiceUI === 'none' && !showAnswer && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-[10px] font-black uppercase tracking-tighter text-primary hover:bg-primary/10 gap-1 rounded-lg"
                                    onClick={() => setPracticeUI('selecting')}
                                >
                                    <Zap className="w-3 h-3 fill-current" />
                                    Practice Problem
                                </Button>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">Concepts ready for study</p>
                            <span className="text-xs text-muted-foreground tabular-nums">Interval: {currentItem?.interval}d</span>
                        </div>
                    </div>

                    <CardContent className="p-8 md:p-12 overflow-y-auto flex-1 relative">
                        {practiceUI === 'solving' && practiceProblem ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex items-center justify-between pb-4 border-b border-border/40">
                                    <div className="flex items-center gap-2 text-primary">
                                        <Zap className="w-5 h-5 fill-current" />
                                        <span className="text-sm font-black uppercase tracking-widest">Practice Mode</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 rounded-full text-xs font-bold px-4"
                                        onClick={() => {
                                            setPracticeUI('none');
                                            setPracticeProblem(null);
                                        }}
                                    >
                                        Back to Concept
                                    </Button>
                                </div>

                                <div className="prose dark:prose-invert max-w-none text-lg text-foreground prose-p:my-2 prose-pre:bg-muted prose-pre:text-foreground">
                                    <MarkdownRenderer content={practiceProblem?.question} />
                                </div>

                                {showPracticeAnswer && (
                                    <div className="mt-8 pt-8 border-t border-border/40 animate-in fade-in zoom-in-95">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">Solution</div>
                                        <div className="prose dark:prose-invert max-w-none text-foreground prose-p:my-2 prose-pre:bg-muted prose-pre:text-foreground">
                                            <MarkdownRenderer content={practiceProblem?.solution} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : practiceUI === 'selecting' ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in-95 duration-300">
                                <div className="space-y-3">
                                    <div className="p-4 rounded-full bg-primary/10 text-primary w-fit mx-auto">
                                        <Zap className="w-10 h-10 fill-current" />
                                    </div>
                                    <h3 className="text-2xl font-black tracking-tight">Practice this Concept</h3>
                                    <p className="text-muted-foreground max-w-[280px] mx-auto text-sm">Select the type of practice problem you want to solve for <b>{currentItem?.type === 'concept' ? currentItem.title : 'this problem'}</b>.</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-md">
                                    <Button
                                        variant="outline"
                                        className="h-auto py-4 px-6 flex flex-col items-start gap-1 rounded-2xl border-2 hover:border-primary hover:bg-primary/5 transition-all text-left group"
                                        onClick={() => handleGetPractice('new')}
                                    >
                                        <div className="flex items-center gap-2">
                                            <PlusCircle className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                                            <span className="font-bold">New Problem</span>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">Never answered before</span>
                                    </Button>

                                    <div className="grid grid-cols-2 gap-2">
                                        {[3, 4, 5].map((level) => (
                                            <Button
                                                key={level}
                                                variant="outline"
                                                className="h-auto py-2 px-3 flex flex-col items-center justify-center gap-0.5 rounded-xl border-2 hover:border-primary hover:bg-primary/5 transition-all"
                                                onClick={() => handleGetPractice('level', level as ReviewGrade)}
                                            >
                                                <span className="text-[10px] font-black text-primary">LVL {level}</span>
                                                <span className="text-[8px] font-bold text-muted-foreground uppercase">
                                                    {level === 3 ? 'Easy' : level === 4 ? 'Good' : 'Hard'}
                                                </span>
                                            </Button>
                                        ))}
                                        <Button
                                            variant="outline"
                                            className="h-auto py-2 px-3 flex flex-col items-center justify-center gap-0.5 rounded-xl border-2 hover:border-destructive hover:bg-destructive/5 transition-all"
                                            onClick={() => handleGetPractice('level', 1)}
                                        >
                                            <span className="text-[10px] font-black text-destructive">AGAIN</span>
                                            <span className="text-[8px] font-bold text-muted-foreground uppercase">Repeated</span>
                                        </Button>
                                    </div>
                                </div>

                                <Button
                                    variant="ghost"
                                    className="rounded-full font-bold text-muted-foreground"
                                    onClick={() => setPracticeUI('none')}
                                >
                                    Cancel
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center space-y-6">
                                {currentItem && currentItem.type === 'concept' ? (
                                    <>
                                        <h2 className="text-3xl md:text-4xl font-bold">{currentItem.title}</h2>
                                        {!showAnswer && (
                                            <div className="flex justify-center mt-12 animate-pulse text-muted-foreground">
                                                <HelpCircle className="w-16 h-16 opacity-20" />
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-left prose dark:prose-invert max-w-none text-foreground prose-p:my-2 prose-pre:bg-muted prose-pre:text-foreground">
                                        <MarkdownRenderer content={currentItem?.question || ""} />
                                    </div>
                                )}
                            </div>
                        )}

                        {showAnswer && practiceUI === 'none' && currentItem && (
                            <div className="mt-12 pt-8 border-t border-border animate-in fade-in slide-in-from-bottom-4">
                                <div className="prose dark:prose-invert max-w-none text-foreground prose-p:my-2 prose-pre:bg-muted prose-pre:text-foreground">
                                    <MarkdownRenderer content={currentItem.type === 'concept' ? currentItem.content : currentItem.solution} />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Controls Base */}
                <div className="h-24 flex items-center justify-center shrink-0">
                    {practiceUI === 'solving' ? (
                        !showPracticeAnswer ? (
                            <Button
                                size="lg"
                                className="w-full max-w-sm rounded-full h-14 text-lg shadow-lg"
                                onClick={() => setShowPracticeAnswer(true)}
                            >
                                <Search className="w-5 h-5 mr-2" />
                                Reveal Solution
                            </Button>
                        ) : (
                                <div className="grid grid-cols-4 gap-2 w-full animate-in zoom-in-95">
                                    <Button
                                        variant="destructive"
                                        className="h-16 flex flex-col gap-1 rounded-xl"
                                        onClick={() => handleGrade(1, true)}
                                    >
                                        <X className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase">Again</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-16 flex flex-col gap-1 bg-orange-500/10 text-orange-600 border-orange-500/20 rounded-xl hover:bg-orange-500/20 hover:text-orange-700 transition-all font-bold"
                                        onClick={() => handleGrade(5, true)}
                                    >
                                        <span className="text-[10px] uppercase font-black">Level 5</span>
                                        <span className="text-xs uppercase">Hard</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-16 flex flex-col gap-1 bg-green-500/10 text-green-600 border-green-500/20 rounded-xl hover:bg-green-500/20 hover:text-green-700 dark:text-green-400 font-bold"
                                        onClick={() => handleGrade(4, true)}
                                    >
                                        <span className="text-[10px] uppercase font-black">Level 4</span>
                                        <span className="text-xs uppercase">Good</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-16 flex flex-col gap-1 bg-blue-500/10 text-blue-600 border-blue-500/20 rounded-xl hover:bg-blue-500/20 hover:text-blue-700 dark:text-blue-400 font-bold"
                                        onClick={() => handleGrade(3, true)}
                                    >
                                        <span className="text-[10px] uppercase font-black">Level 3</span>
                                        <span className="text-xs uppercase">Easy</span>
                                    </Button>
                                </div>
                        )
                    ) : !showAnswer ? (
                        <Button
                            size="lg"
                            className="w-full max-w-sm rounded-full h-14 text-lg shadow-lg"
                            onClick={() => setShowAnswer(true)}
                            disabled={practiceUI !== 'none'}
                        >
                            <Brain className="w-5 h-5 mr-2" />
                            Reveal Answer
                        </Button>
                    ) : (
                        <div className="grid grid-cols-4 gap-2 w-full animate-in zoom-in-95">
                            <Button
                                variant="destructive"
                                className="h-16 flex flex-col gap-1 rounded-xl"
                                onClick={() => handleGrade(1)}
                            >
                                <X className="w-4 h-4" />
                                <span className="text-xs font-bold">Again</span>
                            </Button>
                            <Button
                                variant="secondary"
                                className="h-16 flex flex-col gap-1 border-2 border-border/40 rounded-xl"
                                onClick={() => handleGrade(3)}
                            >
                                <span className="font-bold text-xs">Hard</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-16 flex flex-col gap-1 bg-green-500/10 text-green-600 border-green-500/20 rounded-xl hover:bg-green-500/20 hover:text-green-700 dark:text-green-400"
                                onClick={() => handleGrade(4)}
                            >
                                <span className="font-bold text-xs uppercase">Good</span>
                            </Button>
                            <Button
                                variant="outline"
                                className="h-16 flex flex-col gap-1 bg-blue-500/10 text-blue-600 border-blue-500/20 rounded-xl hover:bg-blue-500/20 hover:text-blue-700 dark:text-blue-400"
                                onClick={() => handleGrade(5)}
                            >
                                <span className="font-bold text-xs uppercase">Easy</span>
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <ConceptPopup
                concept={activeConcept}
                onClose={() => setActiveConcept(null)}
            />

            <AIChoiceModal
                isOpen={aiModal.open}
                onClose={() => setAiModal({ open: false, data: null })}
                title={`Generate Problem for ${aiModal.data?.title}`}
                description="Gemini 3.1 will create a professional study problem based on this concept's content."
                onGenerateInApp={handleAIChoiceInApp}
                onCopyPrompt={handleAIChoiceCopyPrompt}
                isGenerating={isGeneratingAI}
            />
        </div>
    );
}
