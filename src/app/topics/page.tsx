"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/db/api";
import { Topic, Concept, Problem } from "@/lib/db/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    Pencil,
    Trash2,
    ChevronDown,
    ChevronUp,
    Check,
    X,
    Tag,
    Lightbulb,
    Link as LinkIcon,
    AlertCircle,
    Loader2,
    Wand2,
    Sparkles,
    Play
} from "lucide-react";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { cn } from "@/lib/utils";
import { aiPrompts } from "@/lib/utils/ai-prompts";
import { AdaptPromptModal } from "@/components/ai/AdaptPromptModal";
import { ConceptPopup } from "@/components/knowledge/ConceptPopup";
import { ExamSettingsModal, ExamSettings } from "@/components/exam/ExamSettingsModal";
import { AIChoiceModal } from "@/components/ai/AIChoiceModal";
import { AIGenerator } from "@/components/ai/AIGenerator";
import { generateProblemFromContent } from "@/lib/ai/actions";

export default function TopicsPage() {
    const router = useRouter();
    const [topics, setTopics] = useState<Topic[]>([]);
    const [concepts, setConcepts] = useState<Concept[]>([]);
    const [problems, setProblems] = useState<Problem[]>([]);
    const [loading, setLoading] = useState(true);
    const [copiedTopicId, setCopiedTopicId] = useState<string | null>(null);

    // UI State
    const [newTopicName, setNewTopicName] = useState("");
    const [newTopicColor, setNewTopicColor] = useState("#3b82f6");
    const [error, setError] = useState<string | null>(null);
    const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
    const [editTopicName, setEditTopicName] = useState("");




    // Adapt Modal State
    const [adaptModal, setAdaptModal] = useState<{ open: boolean; topic: Topic | null }>({
        open: false,
        topic: null
    });

    // Deletion
    const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string }>({
        open: false,
        id: ""
    });
    const [selectedPopupConcept, setSelectedPopupConcept] = useState<Concept | null>(null);
    const [examModal, setExamModal] = useState<{ open: boolean; topic: Topic | null; maxCount: number }>({
        open: false,
        topic: null,
        maxCount: 0
    });
    const [aiModal, setAiModal] = useState<{ open: boolean; type: "topic"; data: Topic | null }>({
        open: false,
        type: "topic",
        data: null
    });
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const [allTopics, allItems] = await Promise.all([
                api.topics.list(),
                api.items.list()
            ]);
            setTopics(allTopics);
            setConcepts(allItems.filter((i): i is Concept => i.type === "concept"));
            setProblems(allItems.filter((i): i is Problem => i.type === "problem"));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleStartExam = (settings: ExamSettings) => {
        if (!examModal.topic) return;
        const params = new URLSearchParams();
        params.set("topicId", examModal.topic.id);
        params.set("count", settings.count.toString());
        params.set("practice", settings.isPractice.toString());
        params.set("coverage", settings.coverageMode.toString());
        router.push(`/exam?${params.toString()}`);
    };

    const handleCreateTopic = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTopicName.trim()) return;

        setError(null);
        try {
            await api.topics.create({
                name: newTopicName,
                color: newTopicColor
            });
            setNewTopicName("");
            loadData();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleUpdateTopic = async (topicId: string) => {
        if (!editTopicName.trim()) {
            setEditingTopicId(null);
            return;
        }

        setError(null);
        try {
            await api.topics.update(topicId, { name: editTopicName });
            setEditingTopicId(null);
            loadData();
        } catch (err: any) {
            setError(err.message);
        }
    };



    const handleTopicAI = (topic: Topic) => {
        setAiModal({ open: true, type: "topic", data: topic });
    };

    const handleAIChoiceDirect = async () => {
        if (!aiModal.data) return;
        setIsGeneratingAI(true);
        try {
            const topic = aiModal.data;
            const topicConcepts = concepts.filter(c => c.topicIds.includes(topic.id));
            const prompt = aiPrompts.generateFromTopic(topic, topicConcepts);

            const data = await generateProblemFromContent(prompt);
            handleAIGenerated(data);
        } catch (err) {
            console.error("AI Generation Failed:", err);
        } finally {
            setIsGeneratingAI(false);
            setAiModal({ ...aiModal, open: false });
        }
    };

    const handleAIChoiceWithSource = () => {
        setIsAIGeneratorOpen(true);
        setAiModal({ ...aiModal, open: false });
    };

    const handleAIGenerated = (data: { question: string; solution: string; newConcepts?: { title: string; content: string }[] }) => {
        const topic = aiModal.data as Topic;
        const enrichedData = {
            ...data,
            sourceTopicIds: [topic.id],
        };
        sessionStorage.setItem("ai_import_data", JSON.stringify(enrichedData));
        router.push("/problems/new?import=ai");
    };

    const handleAIChoiceCopyPrompt = () => {
        if (!aiModal.data) return;
        const topic = aiModal.data;
        const topicConcepts = concepts.filter(c => c.topicIds.includes(topic.id));
        const prompt = aiPrompts.generateFromTopic(topic, topicConcepts);
        navigator.clipboard.writeText(prompt);
    };

    const handleDeleteConfirm = async () => {
        await api.topics.delete(deleteModal.id);
        setDeleteModal({ ...deleteModal, open: false });
        loadData();
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Organizing topics...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10 px-4 md:px-6 space-y-10 max-w-6xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Topics & Concepts</h1>
                    <p className="text-muted-foreground">Manage your knowledge structure and hints based on available concepts.</p>
                </div>
            </div>

            {/* Create Topic Area */}
            <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                    <form onSubmit={handleCreateTopic} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-1 space-y-2 w-full">
                            <label className="text-sm font-semibold ml-1">New Subject Name</label>
                            <Input
                                placeholder="e.g., Linear Algebra, Organic Chemistry"
                                value={newTopicName}
                                onChange={(e) => setNewTopicName(e.target.value)}
                                className="bg-background"
                            />
                        </div>
                        <div className="space-y-2 w-full md:w-32">
                            <label className="text-sm font-semibold ml-1">Color</label>
                            <div className="flex gap-2 items-center h-10 px-3 bg-background border rounded-md">
                                <input
                                    type="color"
                                    value={newTopicColor}
                                    onChange={(e) => setNewTopicColor(e.target.value)}
                                    className="w-6 h-6 rounded cursor-pointer border-none bg-transparent"
                                />
                                <span className="text-xs font-mono uppercase truncate opacity-60">{newTopicColor}</span>
                            </div>
                        </div>
                        <Button type="submit" className="w-full md:w-auto h-10 px-8 rounded-full">
                            <Plus className="w-4 h-4 mr-2" /> Add Topic
                        </Button>
                    </form>
                    {error && (
                        <div className="mt-3 flex items-center gap-2 text-destructive text-sm font-medium bg-destructive/10 p-2 rounded-md animate-in fade-in slide-in-from-top-1">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Topics Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {topics.map(topic => {
                    const isEditing = editingTopicId === topic.id;

                    return (
                        <Card key={topic.id} className="flex flex-col group hover:shadow-lg transition-all border-border/60">
                            <CardHeader className="pb-3 border-b border-border/40 relative">
                                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-full hover:bg-primary/10 text-primary"
                                        onClick={() => handleTopicAI(topic)}
                                        title="AI Problem Assistant"
                                    >
                                        <Wand2 className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-full hover:bg-primary/10 text-primary"
                                        onClick={() => {
                                            const eligibleProblems = problems.filter(p => p.topicIds.includes(topic.id));
                                            setExamModal({ open: true, topic, maxCount: eligibleProblems.length });
                                        }}
                                        title="Start Focused Exam"
                                    >
                                        <Play className="w-3.5 h-3.5 fill-current" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-full hover:bg-primary/10 text-primary"
                                        onClick={() => setAdaptModal({ open: true, topic })}
                                        title="Adapt External Problem"
                                    >
                                        <Sparkles className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-full hover:bg-muted"
                                        onClick={() => {
                                            setEditingTopicId(topic.id);
                                            setEditTopicName(topic.name);
                                        }}
                                    >
                                        <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 rounded-full hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => setDeleteModal({ open: true, id: topic.id })}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>

                                {isEditing ? (
                                    <div className="flex gap-2 items-center pt-1">
                                        <Input
                                            value={editTopicName}
                                            onChange={(e) => setEditTopicName(e.target.value)}
                                            className="h-8 text-sm py-0"
                                            autoFocus
                                            onKeyDown={(e) => e.key === "Enter" && handleUpdateTopic(topic.id)}
                                        />
                                        <Button size="icon" className="h-8 w-8 shrink-0" onClick={() => handleUpdateTopic(topic.id)}>
                                            <Check className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setEditingTopicId(null)}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: topic.color }} />
                                            <CardTitle className="text-xl">{topic.name}</CardTitle>
                                        </div>
                                    </div>
                                )}
                            </CardHeader>

                            <CardContent className="p-0 flex-1 flex flex-col">
                                <div className="p-4 space-y-4 flex-1 overflow-y-auto max-h-[400px]">


                                    {/* Concepts Section */}
                                    <div className="pt-2">
                                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                                            <Tag className="w-3 h-3 text-primary" /> All Subject Concepts
                                        </h3>
                                        <div className="flex flex-wrap gap-1.5">
                                            {concepts.filter(c => c.topicIds.includes(topic.id)).length > 0 ? (
                                                concepts.filter(c => c.topicIds.includes(topic.id)).map(c => (
                                                    <Badge
                                                        key={c.id}
                                                        variant="outline"
                                                        className="text-[10px] font-medium py-0.5 px-2 bg-background hover:bg-primary/5 transition-colors cursor-pointer active:scale-95"
                                                        onClick={() => setSelectedPopupConcept(c)}
                                                    >
                                                        {c.title}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <span className="text-[10px] text-muted-foreground italic w-full text-center py-2">No concepts yet</span>
                                            )}
                                        </div>
                                    </div>
                                </div>


                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <DeleteConfirmModal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ ...deleteModal, open: false })}
                onConfirm={handleDeleteConfirm}
                title="Delete Subject"
                description="Are you sure? This will remove the subject from all concepts/problems."

            />
            <AdaptPromptModal
                isOpen={adaptModal.open}
                onClose={() => setAdaptModal({ ...adaptModal, open: false })}
                topicName={adaptModal.topic?.name || ""}
                promptText={adaptModal.topic ? aiPrompts.adaptExternal(concepts.filter(c => c.topicIds.includes(adaptModal.topic!.id))) : ""}
            />
            <ConceptPopup
                concept={selectedPopupConcept}
                onClose={() => setSelectedPopupConcept(null)}
            />
            <ExamSettingsModal
                isOpen={examModal.open}
                onClose={() => setExamModal({ ...examModal, open: false })}
                onStart={handleStartExam}
                title={`Focused Exam: ${examModal.topic?.name}`}
                description={`Master this topic with questions covering all concepts. (${examModal.maxCount} available)`}
                maxCount={examModal.maxCount}
            />
            <AIChoiceModal
                isOpen={aiModal.open}
                onClose={() => setAiModal({ ...aiModal, open: false })}
                title={`Generate from "${aiModal.data?.name}"`}
                description="Create study problems using all concepts in this topic."
                onGenerateDirect={handleAIChoiceDirect}
                onGenerateWithSource={handleAIChoiceWithSource}
                onCopyPrompt={handleAIChoiceCopyPrompt}
                isGenerating={isGeneratingAI}
            />

            <AIGenerator 
                isOpen={isAIGeneratorOpen}
                onClose={() => setIsAIGeneratorOpen(false)}
                onGenerated={handleAIGenerated}
                initialContent={aiModal.data ? `Topic: ${aiModal.data.name}` : ""}
                relatedConcepts={aiModal.data ? concepts.filter(c => c.topicIds.includes(aiModal.data!.id)) : []}
            />
        </div>
    );
}
