"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/db/api";
import { Concept, Problem, Topic } from "@/lib/db/models";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { format } from "date-fns";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { Pencil, Trash2, Filter, X, Wand2, Check as CheckIcon, Play, Sparkles, FileJson } from "lucide-react";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { AIConceptImportModal } from "@/components/ai/AIConceptImportModal";
import { AIGenerator } from "@/components/ai/AIGenerator";
import { AIDiscoveryModal } from "@/components/ai/AIDiscoveryModal";
import { aiPrompts } from "@/lib/utils/ai-prompts";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ConceptPopup } from "@/components/knowledge/ConceptPopup";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkActionBar } from "@/components/ui/BulkActionBar";
import { BulkTopicEditModal } from "@/components/ui/BulkTopicEditModal";
import { ExamSettingsModal, ExamSettings } from "@/components/exam/ExamSettingsModal";
import { useRouter } from "next/navigation";
import { AIChoiceModal } from "@/components/ai/AIChoiceModal";
import { generateProblemFromContent, discoverConceptsFromContent } from "@/lib/ai/actions";

export default function KnowledgeBase() {
    const router = useRouter();
    const [concepts, setConcepts] = useState<Concept[]>([]);
    const [problems, setProblems] = useState<Problem[]>([]);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [discoveryCopied, setDiscoveryCopied] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [selectedPopupConcept, setSelectedPopupConcept] = useState<Concept | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false);
    const [examModal, setExamModal] = useState<{ open: boolean; conceptId: string; title: string; maxCount: number }>({
        open: false,
        conceptId: "",
        title: "",
        maxCount: 0
    });
    const [aiModal, setAiModal] = useState<{ open: boolean; type: "concept" | "topic"; data: any }>({
        open: false,
        type: "concept",
        data: null
    });
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);
    const [isAIDiscoveryOpen, setIsAIDiscoveryOpen] = useState(false);

    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const PAGE_SIZE = 24;

    const loadData = async (reset = false) => {
        setLoading(true);
        const currentPage = reset ? 0 : page;

        try {
            const [newConcepts, allTopics] = await Promise.all([
                api.concepts.listSummaries({
                    topicId: selectedTopicId || undefined,
                    limit: PAGE_SIZE,
                    offset: currentPage * PAGE_SIZE
                }),
                api.topics.list()
            ]);

            setTopics(allTopics);
            if (reset) {
                setConcepts(newConcepts);
                setPage(1);
            } else {
                setConcepts(prev => [...prev, ...newConcepts]);
                setPage(prev => prev + 1);
            }
            setHasMore(newConcepts.length === PAGE_SIZE);
        } catch (error) {
            console.error("Failed to load data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData(true);
    }, [selectedTopicId]);

    const handleStartExam = (settings: ExamSettings) => {
        const params = new URLSearchParams();
        params.set("conceptId", examModal.conceptId);
        params.set("count", settings.count.toString());
        params.set("practice", settings.isPractice.toString());
        router.push(`/exam?${params.toString()}`);
    };

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
            await api.items.updateConcept(id, { topicIds });
        }
        setSelectedIds([]);
        loadData();
    };

    const handleBulkExam = () => {
        const eligibleProblems = problems.filter(p => p.hints.some(h => selectedIds.includes(h)));
        setExamModal({
            open: true,
            conceptId: selectedIds.join(','),
            title: "Multiple Concepts",
            maxCount: eligibleProblems.length
        });
    };

    const handleDiscoverPrompt = () => {
        const topic = topics.find(t => t.id === selectedTopicId);
        if (!topic) return;
        setAiModal({ open: true, type: "topic", data: topic });
    };

    const handleAIChoiceWithSource = async () => {
        if (!aiModal.data) return;
        
        if (aiModal.type === "concept") {
            setIsAIGeneratorOpen(true);
        } else {
            setIsAIDiscoveryOpen(true);
        }
        setAiModal({ ...aiModal, open: false });
    };

    const handleAIChoiceDirect = async () => {
        if (!aiModal.data) return;
        setIsGeneratingAI(true);
        try {
            if (aiModal.type === "concept") {
                const concept = aiModal.data as Concept;
                const relatedConcepts = concepts.filter(c =>
                    c.id !== concept.id &&
                    c.topicIds.some(tid => concept.topicIds.includes(tid))
                );
                const prompt = aiPrompts.generateFromConcept(concept, relatedConcepts);

                const data = await generateProblemFromContent(prompt);
                handleAIGenerated(data);
            } else {
                const topic = aiModal.data as Topic;
                const topicConcepts = concepts.filter(c => c.topicIds.includes(topic.id));
                const prompt = aiPrompts.discoverConcepts(topic, topicConcepts);

                const data = await discoverConceptsFromContent(prompt);
                handleAIDiscovered(data);
            }
        } catch (err) {
            console.error("AI Generation Failed:", err);
        } finally {
            setIsGeneratingAI(false);
            setAiModal({ ...aiModal, open: false });
        }
    };

    const handleAIGenerated = (data: { question: string; solution: string; newConcepts?: { title: string; content: string }[] }) => {
        const concept = aiModal.data as Concept;
        const enrichedData = {
            ...data,
            sourceTopicIds: concept.topicIds,
            sourceConceptId: concept.id
        };
        sessionStorage.setItem("ai_import_data", JSON.stringify(enrichedData));
        router.push("/problems/new?import=ai");
    };

    const handleAIDiscovered = (data: { concepts: { title: string; content: string }[] }) => {
        sessionStorage.setItem("ai_import_concepts", JSON.stringify(data.concepts));
        setImportModalOpen(true);
    };

    const handleAIChoiceCopyPrompt = () => {
        if (!aiModal.data) return;
        let prompt = "";
        if (aiModal.type === "concept") {
            const concept = aiModal.data as Concept;
            const relatedConcepts = concepts.filter(c =>
                c.id !== concept.id &&
                c.topicIds.some(tid => concept.topicIds.includes(tid))
            );
            prompt = aiPrompts.generateFromConcept(concept, relatedConcepts);
        } else {
            const topic = aiModal.data as Topic;
            const topicConcepts = concepts.filter(c => c.topicIds.includes(topic.id));
            prompt = aiPrompts.discoverConcepts(topic, topicConcepts);
        }
        navigator.clipboard.writeText(prompt);
    };

    return (
        <div className="container mx-auto py-10 px-4 md:px-6 space-y-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
                    <p className="text-muted-foreground">Manage your core concepts and definitions here.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setImportModalOpen(true)}
                        className="gap-2 border-primary/20 hover:bg-primary/5 text-primary"
                        disabled={!selectedTopicId}
                        title={!selectedTopicId ? "Select a topic first" : "Bulk import concepts from AI"}
                    >
                        <FileJson className="w-4 h-4" /> Import Concepts
                    </Button>
                    <Link href="/knowledge/new">
                        <Button>Add Concept</Button>
                    </Link>
                </div>
            </div>

            {topics.length > 0 && (
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
                        All
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
                    {selectedTopicId && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedTopicId(null)}
                                className="h-8 px-2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-3 h-3 mr-1" /> Clear
                            </Button>
                            <div className="h-4 w-[1px] bg-border mx-1" />
                            <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                    "h-8 rounded-full gap-2 transition-all",
                                    "bg-primary/5 text-primary border-primary/20 hover:bg-primary/10"
                                )}
                                onClick={handleDiscoverPrompt}
                                title="Generate prompt to discover missing concepts for this topic"
                            >
                                <>
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Discover New
                                </>
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {loading ? (
                <div className="text-center text-muted-foreground p-8">Loading concepts...</div>
            ) : concepts.length === 0 ? (
                <Card className="p-12 text-center flex flex-col items-center">
                    <h2 className="text-xl font-semibold mb-2">No concepts yet</h2>
                    <p className="text-muted-foreground mb-4">Start building your knowledge base.</p>
                    <Link href="/knowledge/new">
                        <Button variant="outline">Add First Concept</Button>
                    </Link>
                </Card>
            ) : (
                <>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {concepts
                            .filter(c => !selectedTopicId || c.topicIds.includes(selectedTopicId))
                            .map((concept) => (
                                <Card
                                    key={concept.id}
                                    className={cn(
                                        "flex flex-col group hover:shadow-lg transition-all duration-300 cursor-pointer active:scale-[0.98] relative",
                                        selectedIds.includes(concept.id) ? "border-primary ring-1 ring-primary/20 bg-primary/5" : "border-border/60"
                                    )}
                                    onClick={(e) => {
                                        if (selectedIds.length > 0) {
                                            e.preventDefault();
                                            toggleSelection(concept.id);
                                        } else {
                                            setSelectedPopupConcept(concept);
                                        }
                                    }}
                                >
                                    <div className="absolute top-4 right-4 z-10" onClick={e => e.stopPropagation()}>
                                        <div className={cn(
                                            "w-6 h-6 rounded-full transition-all duration-300 relative flex items-center justify-center cursor-pointer",
                                            selectedIds.includes(concept.id)
                                                ? "bg-primary text-primary-foreground shadow-md shadow-primary/30 scale-100"
                                                : "bg-background/80 backdrop-blur-md border border-border/80 text-transparent hover:border-primary/50 opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100"
                                        )}>
                                            <Checkbox
                                                checked={selectedIds.includes(concept.id)}
                                                onCheckedChange={() => toggleSelection(concept.id)}
                                                className="w-full h-full rounded-full border-none shadow-none text-current data-[state=checked]:bg-transparent data-[state=checked]:text-current opacity-0 absolute inset-0 z-20 cursor-pointer"
                                            />
                                            <CheckIcon className={cn(
                                                "w-3.5 h-3.5 pointer-events-none transition-all duration-300",
                                                selectedIds.includes(concept.id) ? "scale-100 opacity-100" : "scale-50 opacity-0"
                                            )} strokeWidth={3.5} />
                                        </div>
                                    </div>
                                    <CardHeader className="space-y-3 pr-10">
                                        <div className="flex flex-wrap gap-1.5 h-5 overflow-hidden">
                                            {(concept.topicIds || []).map(tid => {
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
                                        <CardTitle className="text-xl group-hover:text-primary transition-colors">{concept.title}</CardTitle>
                                        <CardDescription>Created: {format(new Date(concept.createdAt), "MMM d, yyyy")}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 min-h-[40px] py-2">
                                        <div className="text-xs text-muted-foreground line-clamp-2">
                                            Click to view full content, diagrams, and formulas.
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex items-center justify-between border-t border-border/50 pt-4 bg-muted/30">
                                        <div className="flex gap-2 text-xs text-muted-foreground font-medium">
                                            <span>Due: {format(new Date(concept.nextReviewDate), "MMM d")}</span>
                                            <span>•</span>
                                            <span>{concept.interval}d</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-primary hover:bg-primary/10"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const eligibleProblems = problems.filter(p => p.hints.includes(concept.id));
                                                    setExamModal({
                                                        open: true,
                                                        conceptId: concept.id,
                                                        title: concept.title,
                                                        maxCount: eligibleProblems.length
                                                    });
                                                }}
                                                title="Start Focused Exam"
                                            >
                                                <Play className="w-4 h-4 fill-current" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={cn(
                                                    "h-8 w-8 transition-all",
                                                    "text-muted-foreground hover:text-primary"
                                                )}
                                                onClick={(e) => {
                                                     e.preventDefault();
                                                     e.stopPropagation();
                                                     setAiModal({ open: true, type: "concept", data: concept });
                                                 }}
                                                 title="AI Problem Assistant"
                                             >
                                                 <Wand2 className="w-4 h-4" />
                                             </Button>
                                            <Link href={`/knowledge/edit/${concept.id}`}>
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
                                                    setItemToDelete(concept.id);
                                                    setDeleteModalOpen(true);
                                                }}
                                                title="Delete Concept"
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
                                Load More Concepts
                            </Button>
                        </div>
                    )}
                    {loading && page > 0 && (
                        <div className="text-center text-muted-foreground py-8">Loading more...</div>
                    )}
                </>
            )}

            <ConceptPopup
                concept={selectedPopupConcept}
                onClose={() => setSelectedPopupConcept(null)}
            />

            <ExamSettingsModal
                isOpen={examModal.open}
                onClose={() => setExamModal({ ...examModal, open: false })}
                onStart={handleStartExam}
                title={`Focused Exam: ${examModal.title}`}
                description={`Test your mastery with questions related to this concept. (${examModal.maxCount} available)`}
                maxCount={examModal.maxCount}
            />

            <DeleteConfirmModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDelete}
                isLoading={isDeleting}
                title="Delete Concept"
                description="Are you sure you want to delete this concept? This action cannot be undone and the concept will be permanently removed from your knowledge base."
            />

            <AIChoiceModal
                isOpen={aiModal.open}
                onClose={() => setAiModal({ ...aiModal, open: false })}
                title={aiModal.type === "concept" ? `Generate from "${aiModal.data?.title}"` : `Explore "${aiModal.data?.name}"`}
                description={aiModal.type === "concept" ? "Create a study problem based on this concept's definition." : "Discover missing concepts or create problems for this topic."}
                onGenerateDirect={handleAIChoiceDirect}
                onGenerateWithSource={handleAIChoiceWithSource}
                onCopyPrompt={handleAIChoiceCopyPrompt}
                isGenerating={isGeneratingAI}
            />

            <AIConceptImportModal
                isOpen={importModalOpen}
                onClose={() => setImportModalOpen(false)}
                topic={topics.find(t => t.id === selectedTopicId) || null}
                onSuccess={loadData}
            />

            <AIGenerator 
                isOpen={isAIGeneratorOpen}
                onClose={() => setIsAIGeneratorOpen(false)}
                onGenerated={handleAIGenerated}
                initialContent={aiModal.type === "concept" ? `Primary Concept: ${aiModal.data?.title}\n\nContent: ${aiModal.data?.content}` : ""}
                relatedConcepts={aiModal.type === "concept" && aiModal.data ? concepts.filter(c => c.topicIds.some(tid => (aiModal.data as Concept).topicIds.includes(tid))) : []}
            />

            {aiModal.type === "topic" && (
                <AIDiscoveryModal 
                    isOpen={isAIDiscoveryOpen}
                    onClose={() => setIsAIDiscoveryOpen(false)}
                    onDiscovered={handleAIDiscovered}
                    topic={aiModal.data as Topic}
                    existingConcepts={concepts.filter(c => (aiModal.data as Topic).id && c.topicIds.includes((aiModal.data as Topic).id))}
                />
            )}

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
        </div>
    );
}
