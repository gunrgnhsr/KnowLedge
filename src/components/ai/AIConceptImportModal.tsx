import * as React from "react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { Sparkles, FileJson, AlertCircle, CheckCircle2, Trash2, Brain, Check as CheckIcon, Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/db/api";
import { Topic } from "@/lib/db/models";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";

interface AIConceptImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    topic: Topic | null;
    onSuccess: () => void;
}

export function AIConceptImportModal({ isOpen, onClose, topic, onSuccess }: AIConceptImportModalProps) {
    const [jsonInput, setJsonInput] = useState("");
    const [concepts, setConcepts] = useState<{ title: string; content: string }[]>([]);
    const [isReviewing, setIsReviewing] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const [errorContext, setErrorContext] = useState<{ snippet: string; marker: string } | null>(null);
    const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');

    React.useEffect(() => {
        if (isOpen) {
            const stored = sessionStorage.getItem("ai_import_concepts");
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        setConcepts(parsed);
                        setCurrentIndex(0);
                        setIsReviewing(true);
                    }
                    sessionStorage.removeItem("ai_import_concepts");
                } catch (err) {
                    console.error("Failed to parse automated discovery results", err);
                }
            }
        }
    }, [isOpen]);

    const handleParse = () => {
        setError(null);
        setErrorContext(null);

        let sanitizedJson = "";
        try {
            let cleanedInput = jsonInput.trim();

            if (cleanedInput.startsWith("```")) {
                cleanedInput = cleanedInput.replace(/^```[a-z]*\n/i, "").replace(/\n```$/, "");
            }

            const firstBrace = cleanedInput.indexOf("{");
            const lastBrace = cleanedInput.lastIndexOf("}");

            if (firstBrace === -1 || lastBrace === -1) {
                throw new Error("No valid JSON object found. Ensure the content starts with '{' and ends with '}'.");
            }

            let jsonString = cleanedInput.substring(firstBrace, lastBrace + 1);

            let inString = false;
            for (let i = 0; i < jsonString.length; i++) {
                const char = jsonString[i];
                if (char === '"') {
                    let backslashes = 0;
                    for (let j = i - 1; j >= 0 && jsonString[j] === "\\"; j--) {
                        backslashes++;
                    }
                    if (backslashes % 2 === 0) {
                        inString = !inString;
                    }
                }

                if (inString && char === "\\") {
                    sanitizedJson += "\\\\";
                    continue;
                }

                if (char === "\n" && inString) {
                    sanitizedJson += "\\n";
                } else if (char === "\r" && inString) {
                } else {
                    sanitizedJson += char;
                }
            }

            const parsed = JSON.parse(sanitizedJson);

            if (!parsed.concepts || !Array.isArray(parsed.concepts)) {
                throw new Error("The AI output is missing the required 'concepts' array.");
            }

            if (parsed.concepts.length === 0) {
                throw new Error("The 'concepts' array is empty.");
            }

            const fixNewlines = (text: string) => {
                if (typeof text !== "string") return text;
                let processed = text.replace(/\\n\\n/g, "\n\n");
                return processed.replace(/\\n(?![a-zA-Z])/g, "\n");
            };

            const parsedConcepts = parsed.concepts.map((c: any) => ({
                title: c.title || "Untitled Concept",
                content: fixNewlines(c.content || "")
            }));

            setConcepts(parsedConcepts);
            setCurrentIndex(0);
            setIsReviewing(true);
        } catch (err: any) {
            let msg = err.message || "Invalid JSON format.";
            setError(msg);

            if (err instanceof SyntaxError && sanitizedJson) {
                const match = msg.match(/at position (\d+)/);
                if (match) {
                    const pos = parseInt(match[1], 10);
                    const start = Math.max(0, pos - 30);
                    const end = Math.min(sanitizedJson.length, pos + 30);
                    const snippet = sanitizedJson.substring(start, end).replace(/\n/g, " ");
                    const marker = " ".repeat(pos - start) + "^";
                    setErrorContext({ snippet, marker });
                }
            }
        }
    };

    const handleImport = async () => {
        if (!topic || concepts.length === 0) return;
        setIsImporting(true);

        try {
            const conceptsToCreate = concepts.map(c => ({
                ...c,
                topicIds: [topic.id]
            }));

            await api.items.createMany(conceptsToCreate);

            setJsonInput("");
            setConcepts([]);
            setIsReviewing(false);
            setCurrentIndex(0);
            setIsImporting(false);
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to save concepts.");
            setIsImporting(false);
        }
    };

    const handleAcceptSingle = async () => {
        if (!topic || !currentConcept) return;
        setIsImporting(true);

        try {
            await api.items.createConcept({
                title: currentConcept.title,
                content: currentConcept.content,
                topicIds: [topic.id]
            });

            // Remove accepted concept and move to next or close
            const newConcepts = concepts.filter((_, i) => i !== currentIndex);
            setConcepts(newConcepts);

            if (newConcepts.length === 0) {
                setIsReviewing(false);
                onSuccess();
                onClose();
            } else {
                if (currentIndex >= newConcepts.length) {
                    setCurrentIndex(newConcepts.length - 1);
                }
                // Optional: show a mini toast/feedback
            }
            setIsImporting(false);
        } catch (err: any) {
            setError(err.message || "Failed to save concept.");
            setIsImporting(false);
        }
    };

    const updateConcept = (field: 'title' | 'content', value: string) => {
        const newConcepts = [...concepts];
        newConcepts[currentIndex] = { ...newConcepts[currentIndex], [field]: value };
        setConcepts(newConcepts);
    };

    const removeCurrentConcept = () => {
        const newConcepts = concepts.filter((_, i) => i !== currentIndex);
        setConcepts(newConcepts);
        if (newConcepts.length === 0) {
            setIsReviewing(false);
        } else if (currentIndex >= newConcepts.length) {
            setCurrentIndex(newConcepts.length - 1);
        }
    };

    const handleClose = () => {
        if (!isImporting) {
            setJsonInput("");
            setConcepts([]);
            setIsReviewing(false);
            setCurrentIndex(0);
            setError(null);
            setErrorContext(null);
            onClose();
        }
    };

    const currentConcept = concepts[currentIndex];

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className={cn(
                "transition-all duration-500 flex flex-col overflow-hidden border border-primary/10 shadow-[0_32px_128px_-24px_rgba(0,0,0,0.5)] bg-card mx-auto centering-container",
                isReviewing ? "max-w-6xl w-[90vw] h-[85vh] rounded-[2.5rem]" : "max-w-2xl rounded-3xl"
            )}>
                <DialogHeader className={cn(
                    "flex-none text-center px-12 transition-all duration-500",
                    isReviewing ? "pt-6 pb-2 border-none bg-transparent" : "pt-8 pb-8 border-b border-primary/5 bg-muted/20"
                )}>
                    <div className="flex flex-col items-center gap-4 w-full">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                                <Sparkles className="w-4 h-4" />
                            </div>
                            <Badge variant="outline" className="text-[10px] px-2.5 py-0.5 uppercase font-black tracking-[0.2em] text-primary border-primary/20 bg-primary/5">Concept Discovery</Badge>
                        </div>
                        {!isReviewing && (
                            <>
                                <DialogTitle className="text-3xl font-black tracking-tighter text-foreground leading-none">
                                    Import Concepts
                                </DialogTitle>
                                <DialogDescription className="text-base max-w-lg text-muted-foreground font-medium italic">
                                    Paste the AI-generated JSON list to bulk-add concepts to "{topic?.name}".
                                </DialogDescription>
                            </>
                        )}
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden min-h-0 bg-background/50">
                    {!isReviewing ? (
                        <div className="h-full p-8 flex flex-col">
                            <div className="relative group flex-1">
                                <Textarea
                                    placeholder='{ "concepts": [ { "title": "...", "content": "..." } ] }'
                                    className="h-full font-mono text-xs bg-muted/10 focus:bg-background focus:ring-primary/20 transition-all resize-none border-primary/5 rounded-[2rem] p-8 shadow-inner"
                                    value={jsonInput}
                                    onChange={(e) => setJsonInput(e.target.value)}
                                />
                                <div className="absolute top-8 right-8 opacity-20 group-hover:opacity-100 transition-opacity text-primary pointer-events-none">
                                    <FileJson className="w-8 h-8" />
                                </div>
                            </div>

                            {error && (
                                <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-4">
                                    <div className="flex items-start gap-3 p-5 rounded-2xl bg-destructive/5 border border-destructive/10 text-destructive text-sm shadow-sm backdrop-blur-md">
                                        <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                                        <p className="font-bold">{error}</p>
                                    </div>

                                    {errorContext && (
                                        <div className="p-5 rounded-2xl bg-black/95 text-white font-mono text-[11px] leading-tight overflow-x-auto border border-white/10 shadow-2xl">
                                            <div className="opacity-50 mb-3 border-b border-white/5 pb-2 uppercase tracking-[0.3em] text-[9px] font-black">Trace Details</div>
                                            <pre className="whitespace-pre">{errorContext.snippet}</pre>
                                            <pre className="text-destructive font-black underline decoration-wavy">{errorContext.marker}</pre>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col h-full overflow-hidden">
                            {/* Switchable Review Interface */}
                            <div className="flex-1 flex flex-col overflow-hidden max-w-4xl mx-auto w-full">
                                {/* Mode Toggle Hub */}
                                <div className="flex items-center justify-between px-10 py-6 border-b border-primary/5 bg-muted/5">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-3 bg-background p-1 rounded-xl border border-primary/10 shadow-sm">
                                            <Button
                                                variant={viewMode === 'edit' ? 'default' : 'ghost'}
                                                size="sm"
                                                className={cn(
                                                    "h-9 px-4 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                                                    viewMode === 'edit' ? "shadow-lg shadow-primary/20" : "text-muted-foreground"
                                                )}
                                                onClick={() => setViewMode('edit')}
                                            >
                                                Edit Concept
                                            </Button>
                                            <Button
                                                variant={viewMode === 'preview' ? 'default' : 'ghost'}
                                                size="sm"
                                                className={cn(
                                                    "h-9 px-4 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                                                    viewMode === 'preview' ? "shadow-lg shadow-primary/20" : "text-muted-foreground"
                                                )}
                                                onClick={() => setViewMode('preview')}
                                            >
                                                Live Preview
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black ring-4 ring-primary/5">
                                            {currentIndex + 1}
                                        </div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">
                                            OF {concepts.length}
                                        </div>
                                    </div>
                                </div>

                                {/* Focused Panel Area */}
                                <div className="flex-1 overflow-hidden p-8 bg-background/30 backdrop-blur-sm">
                                    {viewMode === 'edit' ? (
                                        <div className="h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-2">Conceptual Identity</label>
                                                <Input
                                                    value={currentConcept?.title || ""}
                                                    onChange={(e) => updateConcept("title", e.target.value)}
                                                    className="font-black text-xl bg-background border-none h-14 transition-all px-6 rounded-2xl shadow-lg shadow-black/5 focus-visible:ring-4 focus-visible:ring-primary/5 placeholder:opacity-20"
                                                    placeholder="Concept Name..."
                                                />
                                            </div>
                                            <div className="flex-1 flex flex-col space-y-3 min-h-0">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-2">Implementation Detail</label>
                                                <div className="flex-1 relative bg-background rounded-[1.5rem] border border-primary/5 shadow-2xl shadow-black/5 overflow-hidden group focus-within:ring-4 focus-within:ring-primary/5 transition-all">
                                                    <Textarea
                                                        value={currentConcept?.content || ""}
                                                        onChange={(e) => updateConcept("content", e.target.value)}
                                                        className="absolute inset-0 w-full h-full resize-none text-sm p-8 font-mono leading-relaxed border-none focus-visible:ring-0 bg-transparent overflow-y-auto"
                                                        placeholder="Define the concept using LaTeX ($\dots$)..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-full rounded-[1.5rem] border border-primary/5 p-10 overflow-y-auto bg-card shadow-[0_24px_64px_-12px_rgba(0,0,0,0.1)] ring-1 ring-primary/5 animate-in fade-in slide-in-from-right-4 duration-500 group/preview relative">
                                            <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none">
                                                <Brain className="w-48 h-48 rotate-12" />
                                            </div>
                                            {currentConcept ? (
                                                <div className="prose dark:prose-invert max-w-none">
                                                    <h3 className="text-2xl font-black mb-8 text-foreground tracking-tighter border-b-4 border-primary/10 pb-4 leading-none">{currentConcept.title}</h3>
                                                    <div className="text-foreground/90 leading-relaxed text-base font-medium">
                                                        <MarkdownRenderer content={currentConcept.content} />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40 text-center gap-6">
                                                    <div className="p-8 rounded-full bg-muted/30">
                                                        <EyeOff className="w-16 h-16 stroke-[1]" />
                                                    </div>
                                                    <p className="text-xl font-black tracking-tight text-foreground/20">Nothing to preview</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex-none p-8 px-12 border-t border-primary/5 bg-muted/10 backdrop-blur-xl">
                    <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-4">
                            {!isReviewing ? (
                                <Button variant="ghost" onClick={handleClose} disabled={isImporting} className="rounded-2xl px-8 h-12 text-muted-foreground hover:bg-background font-bold transition-all hover:text-foreground">
                                    Cancel
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        variant="ghost"
                                        onClick={handleClose}
                                        className="h-12 px-6 rounded-2xl text-muted-foreground hover:text-destructive hover:bg-destructive/5 font-black uppercase tracking-widest text-[10px] transition-all active:scale-95"
                                    >
                                        Abandon Mission
                                    </Button>
                                    <div className="h-6 w-px bg-primary/10 mx-2" />
                                    <Button
                                        variant="ghost"
                                        onClick={removeCurrentConcept}
                                        className="h-12 px-6 rounded-2xl text-destructive hover:bg-destructive/10 font-bold gap-3 transition-all active:scale-95 border border-transparent hover:border-destructive/20 shadow-sm"
                                    >
                                        <Trash2 className="w-4.5 h-4.5" />
                                        Delete
                                    </Button>
                                </>
                            )}
                        </div>

                        {!isReviewing ? (
                            <Button
                                onClick={handleParse}
                                disabled={!jsonInput || !topic}
                                className="h-12 px-8 rounded-2xl gap-3 shadow-2xl shadow-primary/30 bg-primary hover:bg-primary/95 text-primary-foreground font-black tracking-tight text-base transition-all hover:scale-[1.05] active:scale-95"
                            >
                                Begin Review
                                <Brain className="w-5 h-5 animate-pulse" />
                            </Button>
                        ) : (
                            <div className="flex items-center gap-8">
                                <div className="flex items-center gap-6">
                                    {/* Navigation Hub */}
                                    <div className="flex items-center gap-3 bg-background/50 p-1.5 rounded-[1.25rem] border border-primary/10 shadow-lg px-3">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                setCurrentIndex(prev => Math.max(0, prev - 1));
                                                setViewMode('edit');
                                            }}
                                            disabled={currentIndex === 0}
                                            className="h-10 w-10 text-muted-foreground hover:text-primary rounded-xl transition-all"
                                        >
                                            <ChevronLeft className="h-6 w-6" />
                                        </Button>
                                        <div className="flex flex-col items-center justify-center min-w-[3rem] px-2">
                                            <span className="text-[9px] font-black text-primary/40 leading-none mb-1 uppercase tracking-tighter">Navigate</span>
                                            <span className="text-sm font-black text-foreground/80 leading-none">{currentIndex + 1} / {concepts.length}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                setCurrentIndex(prev => Math.min(concepts.length - 1, prev + 1));
                                                setViewMode('edit');
                                            }}
                                            disabled={currentIndex === concepts.length - 1}
                                            className="h-10 w-10 text-muted-foreground hover:text-primary rounded-xl transition-all"
                                        >
                                            <ChevronRight className="h-6 w-6" />
                                        </Button>
                                    </div>

                                    <Button
                                        onClick={handleAcceptSingle}
                                        disabled={isImporting || !topic}
                                        className="h-14 px-8 rounded-[1.25rem] gap-3 bg-background border-2 border-primary/20 hover:border-primary text-primary font-black tracking-tighter text-base transition-all hover:scale-[1.05] active:scale-95 shadow-xl shadow-black/5"
                                    >
                                        {isImporting ? <Sparkles className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                        Accept This
                                    </Button>
                                </div>

                                <div className="h-10 w-px bg-primary/10 mx-2" />

                                <Button
                                    onClick={handleImport}
                                    disabled={concepts.length === 0 || isImporting || !topic}
                                    className="h-14 px-10 rounded-[1.25rem] gap-4 shadow-[0_12px_48px_-12px_rgba(0,0,0,0.5)] shadow-primary/40 bg-primary hover:bg-primary/95 text-primary-foreground font-black tracking-tighter text-lg transition-all hover:scale-[1.05] hover:rotate-[-0.5deg] active:scale-95 group relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                                    {isImporting ? (
                                        <span className="flex items-center gap-3">
                                            <Sparkles className="w-5 h-5 animate-spin" />
                                            Finalizing...
                                        </span>
                                    ) : (
                                        <>
                                            Accept All Remaining
                                            <CheckIcon className="w-6 h-6 transition-all group-hover:scale-125 group-hover:rotate-12" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
