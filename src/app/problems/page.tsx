"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/db/api";
import { Problem, Topic, Concept } from "@/lib/db/models";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { format } from "date-fns";
import { Layers, Pencil, Trash2, Filter, X, Wand2, Check as CheckIcon, Brain, BookOpen } from "lucide-react";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { Badge } from "@/components/ui/badge";
import { aiPrompts } from "@/lib/utils/ai-prompts";
import { AIImportModal } from "@/components/ai/AIImportModal";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkActionBar } from "@/components/ui/BulkActionBar";
import { BulkTopicEditModal } from "@/components/ui/BulkTopicEditModal";
import { ExamSettingsModal, ExamSettings } from "@/components/exam/ExamSettingsModal";
import { useRouter } from "next/navigation";

export default function ProblemBank() {
    const [problems, setProblems] = useState<Problem[]>([]);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [concepts, setConcepts] = useState<Concept[]>([]);
    const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
    const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false);
    const [examModal, setExamModal] = useState<{ open: boolean; problemIds: string[]; title: string; maxCount: number }>({
        open: false,
        problemIds: [],
        title: "",
        maxCount: 0
    });
    const router = useRouter();

    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const PAGE_SIZE = 24;

    const loadData = async (reset = false) => {
        setLoading(true);
        const currentPage = reset ? 0 : page;

        try {
            const [newProblems, allTopics, allConcepts] = await Promise.all([
                api.problems.listSummaries({
                    topicId: selectedTopicId || undefined,
                    conceptId: selectedConceptId || undefined,
                    limit: PAGE_SIZE,
                    offset: currentPage * PAGE_SIZE
                }),
                api.topics.list(),
                api.concepts.listSummaries() // Still need titles for the filter list
            ]);

            setTopics(allTopics);
            setConcepts(allConcepts);

            if (reset) {
                setProblems(newProblems);
                setPage(1);
            } else {
                setProblems(prev => [...prev, ...newProblems]);
                setPage(prev => prev + 1);
            }
            setHasMore(newProblems.length === PAGE_SIZE);
        } catch (error) {
            console.error("Failed to load data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData(true);
    }, [selectedTopicId, selectedConceptId]);

    const handleDelete = async () => {
        setIsDeleting(true);
        if (itemToDelete === "BULK") {
            for (const id of selectedIds) {
                await api.items.delete(id);
            }
            setSelectedIds([]);
        } else if (itemToDelete) {
            await api.items.delete(itemToDelete);
        }
        setIsDeleting(false);
        setDeleteModalOpen(false);
        setItemToDelete(null);
        loadData();
    };

    const toggleSelection = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleBulkTopicSave = async (topicIds: string[]) => {
        for (const id of selectedIds) {
            await api.items.updateProblem(id, { topicIds });
        }
        setSelectedIds([]);
        loadData();
    };

    const handleBulkExam = () => {
        setExamModal({
            open: true,
            problemIds: selectedIds,
            title: "Selected Problems",
            maxCount: selectedIds.length
        });
    };

    const handleStartExam = (settings: ExamSettings) => {
        const queryParams = new URLSearchParams({
            problemIds: examModal.problemIds.join(','),
            count: settings.count.toString(),
            practice: settings.isPractice.toString(),
            coverage: settings.coverageMode.toString()
        });
        router.push(`/exam?${queryParams.toString()}`);
    };

    return (
        <div className="container mx-auto py-10 px-4 md:px-6 space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Problem Bank</h1>
                    <p className="text-muted-foreground">Store practice questions, examples, and past exams.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setImportModalOpen(true)} className="gap-2 border-primary/20 hover:bg-primary/5 text-primary">
                        <Brain className="w-4 h-4" /> Import from AI
                    </Button>
                    <Link href="/problems/new">
                        <Button><Layers className="w-4 h-4 mr-2" /> Add Problem</Button>
                    </Link>
                </div>
            </div>

            {topics.length > 0 && (
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2 pb-2">
                        <div className="flex items-center gap-2 text-sm font-medium mr-2 text-muted-foreground">
                            <Filter className="w-4 h-4" />
                            Filter by Topic:
                        </div>
                        <Button
                            variant={selectedTopicId === null ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedTopicId(null)}
                            className="rounded-full h-8"
                        >
                            All Topics
                        </Button>
                        {topics.map(topic => (
                            <Button
                                key={topic.id}
                                variant={selectedTopicId === topic.id ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedTopicId(topic.id)}
                                className="rounded-full h-8 flex items-center gap-2"
                                style={selectedTopicId === topic.id ? { backgroundColor: topic.color } : {}}
                            >
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedTopicId === topic.id ? 'white' : topic.color }} />
                                {topic.name}
                            </Button>
                        ))}
                    </div>

                    {concepts.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 pb-2">
                            <div className="flex items-center gap-2 text-sm font-medium mr-2 text-muted-foreground">
                                <Brain className="w-4 h-4" />
                                Filter by Concept:
                            </div>
                            <Button
                                variant={selectedConceptId === null ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedConceptId(null)}
                                className="rounded-full h-8"
                            >
                                All Concepts
                            </Button>
                            {concepts
                                .filter(c => !selectedTopicId || c.topicIds.includes(selectedTopicId))
                                .slice(0, 10) // Show first 10 for sanity
                                .map(concept => (
                                    <Button
                                        key={concept.id}
                                        variant={selectedConceptId === concept.id ? "secondary" : "outline"}
                                        size="sm"
                                        onClick={() => setSelectedConceptId(concept.id)}
                                        className={cn(
                                            "rounded-full h-8 flex items-center gap-2 px-3 transition-all",
                                            selectedConceptId === concept.id && "bg-primary/20 text-primary border-primary/30"
                                        )}
                                    >
                                        <BookOpen className="w-3 h-3" />
                                        {concept.title}
                                    </Button>
                                ))}
                            {(selectedTopicId || selectedConceptId) && (
                                <Button variant="ghost" size="sm" onClick={() => { setSelectedTopicId(null); setSelectedConceptId(null); }} className="h-8 px-2 text-muted-foreground hover:text-foreground">
                                    <X className="w-3 h-3 mr-1" /> Clear All Filters
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {loading ? (
                <div className="text-center text-muted-foreground p-8">Loading problems...</div>
            ) : problems.length === 0 ? (
                <Card className="p-12 text-center flex flex-col items-center">
                    <h2 className="text-xl font-semibold mb-2">No problems yet</h2>
                    <p className="text-muted-foreground mb-4">Start adding questions to your problem bank.</p>
                    <Link href="/problems/new">
                        <Button variant="outline">Add First Problem</Button>
                    </Link>
                </Card>
            ) : (
                <>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {problems
                            .filter(p => !selectedTopicId || p.topicIds.includes(selectedTopicId))
                            .filter(p => !selectedConceptId || p.hints.includes(selectedConceptId))
                            .map((problem) => (
                                <Card
                                    key={problem.id}
                                    className={cn(
                                        "flex flex-col group hover:shadow-lg transition-all duration-300 relative cursor-pointer active:scale-[0.98]",
                                        selectedIds.includes(problem.id) ? "border-primary ring-1 ring-primary/20 bg-primary/5" : "border-border/60"
                                    )}
                                    onClick={(e) => {
                                        if (selectedIds.length > 0) {
                                            e.preventDefault();
                                            toggleSelection(problem.id);
                                        }
                                    }}
                                >
                                    <div className="absolute top-4 right-4 z-10" onClick={e => e.stopPropagation()}>
                                        <div className={cn(
                                            "w-6 h-6 rounded-full transition-all duration-300 relative flex items-center justify-center cursor-pointer",
                                            selectedIds.includes(problem.id)
                                                ? "bg-primary text-primary-foreground shadow-md shadow-primary/30 scale-100"
                                                : "bg-background/80 backdrop-blur-md border border-border/80 text-transparent hover:border-primary/50 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100"
                                        )}>
                                            <Checkbox
                                                checked={selectedIds.includes(problem.id)}
                                                onCheckedChange={() => toggleSelection(problem.id)}
                                                className="w-full h-full rounded-full border-none shadow-none text-current data-[state=checked]:bg-transparent data-[state=checked]:text-current opacity-0 absolute inset-0 z-20 cursor-pointer"
                                            />
                                            <CheckIcon className={cn(
                                                "w-3.5 h-3.5 pointer-events-none transition-all duration-300",
                                                selectedIds.includes(problem.id) ? "scale-100 opacity-100" : "scale-50 opacity-0"
                                            )} strokeWidth={3.5} />
                                        </div>
                                    </div>
                                    <CardHeader className="space-y-3 pr-10">
                                        <div className="flex flex-wrap gap-1.5 h-5 overflow-hidden">
                                            {(problem.topicIds || []).map(tid => {
                                                const topic = topics.find(t => t.id === tid);
                                                if (!topic) return null;
                                                return (
                                                    <Badge
                                                        key={tid}
                                                        variant="outline"
                                                        className="text-[10px] uppercase tracking-wider font-bold py-0 h-4 border-none"
                                                        style={{ backgroundColor: topic.color + '15', color: topic.color }}
                                                    >
                                                        {topic.name}
                                                    </Badge>
                                                );
                                            })}
                                        </div>
                                        <div className="text-sm font-medium text-muted-foreground line-clamp-2 mt-2 leading-relaxed h-[40px] overflow-hidden">
                                            Problem ID: {problem.id.slice(0, 8)}... Click to solve and see full content.
                                        </div>
                                        <CardDescription>Added: {format(new Date(problem.createdAt), "MMM d, yyyy")}</CardDescription>
                                    </CardHeader>
                                    <CardFooter className="flex items-center justify-between border-t border-border/50 pt-4 bg-muted/30">
                                        <div className="flex gap-4 text-xs text-muted-foreground font-medium">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase opacity-50">Due</span>
                                                <span>{format(new Date(problem.nextReviewDate), "MMM d")}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase opacity-50">Interval</span>
                                                <span>{problem.interval}d</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Link href={`/problems/solve/${problem.id}`}>
                                                <Button variant="default" size="sm" className="h-8 rounded-full bg-primary/10 text-primary hover:bg-primary/20 border-none shadow-none text-xs font-bold">
                                                    Solve
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={cn(
                                                    "h-8 w-8 transition-all",
                                                    copiedId === problem.id ? "text-green-500 bg-green-500/10" : "text-muted-foreground hover:text-primary"
                                                )}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    const prompt = aiPrompts.generateVariation(problem);
                                                    navigator.clipboard.writeText(prompt);
                                                    setCopiedId(problem.id);
                                                    setTimeout(() => setCopiedId(null), 2000);
                                                }}
                                                title="Generate AI Variation Prompt"
                                            >
                                                {copiedId === problem.id ? <CheckIcon className="w-4 h-4" /> : <Wand2 className="w-4 h-4" />}
                                            </Button>
                                            <Link href={`/problems/edit/${problem.id}`}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setItemToDelete(problem.id);
                                                    setDeleteModalOpen(true);
                                                }}
                                                title="Delete Problem"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardFooter>
                                </Card>
                            ))}
                    </div>
                    {hasMore && !loading && (
                        <div className="flex justify-center pt-8">
                            <Button variant="outline" onClick={() => loadData()} className="gap-2">
                                Load More Problems
                            </Button>
                        </div>
                    )}
                    {loading && page > 0 && (
                        <div className="text-center text-muted-foreground py-8">Loading more...</div>
                    )}
                </>
            )}

            <DeleteConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDelete}
                isLoading={isDeleting}
                title="Delete Problem"
                description="Are you sure you want to delete this practice problem? This action cannot be undone and all data associated with this problem will be lost."
            />

            <AIImportModal
                isOpen={importModalOpen}
                onClose={() => setImportModalOpen(false)}
            />

            <BulkTopicEditModal
                isOpen={bulkEditModalOpen}
                onClose={() => setBulkEditModalOpen(false)}
                onSave={handleBulkTopicSave}
                topics={topics}
                itemCount={selectedIds.length}
            />

            <BulkActionBar
                selectedCount={selectedIds.length}
                onClearSelection={() => setSelectedIds([])}
                onDelete={() => {
                    setItemToDelete("BULK");
                    setDeleteModalOpen(true);
                }}
                onEditTopics={() => setBulkEditModalOpen(true)}
                onStartExam={handleBulkExam}
            />

            <ExamSettingsModal
                isOpen={examModal.open}
                onClose={() => setExamModal(prev => ({ ...prev, open: false }))}
                onStart={handleStartExam}
                title={examModal.title}
                description="Test your knowledge with a focused exam using purely the selected problems."
                maxCount={examModal.maxCount}
                hideSlider={true}
            />
        </div>
    );
}
