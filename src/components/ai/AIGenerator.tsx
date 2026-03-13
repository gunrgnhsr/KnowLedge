"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "../ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { Brain, Sparkles, AlertCircle, CheckCircle2 } from "lucide-react";
import { generateProblemFromContent } from "@/lib/ai/actions";
import { aiPrompts } from "@/lib/utils/ai-prompts";

interface AIGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerated: (data: { question: string; solution: string; newConcepts?: { title: string; content: string }[] }) => void;
    initialContent?: string;
}

export function AIGenerator({ isOpen, onClose, onGenerated, initialContent = "" }: AIGeneratorProps) {
    const [sourceContent, setSourceContent] = useState(initialContent);

    // Update sourceContent if initialContent changes when modal opens
    React.useEffect(() => {
        if (isOpen && initialContent) {
            setSourceContent(initialContent);
        }
    }, [isOpen, initialContent]);

    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!sourceContent.trim()) return;

        setIsGenerating(true);
        setError(null);

        try {
            const prompt = aiPrompts.generateFromRawContent(sourceContent);
            const data = await generateProblemFromContent(prompt);
            onGenerated(data);
            setSourceContent("");
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to generate problem. Please check your API key.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl rounded-3xl border border-primary/10 shadow-2xl">
                <DialogHeader className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                            <Brain className="w-5 h-5" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight">Generate with Gemini 3.1</h2>
                    </div>
                    <DialogDescription className="text-base text-muted-foreground font-medium">
                        Paste your notes, a paragraph from a textbook, or any raw content. Gemini 3.1 Flash-Lite will create a structured problem for you.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-4">
                    <div className="relative group">
                        <Textarea
                            placeholder="Paste your source content here..."
                            className="min-h-[250px] font-sans text-sm bg-muted/30 focus:bg-background transition-all resize-none rounded-2xl p-6 border-primary/5 focus:ring-primary/20"
                            value={sourceContent}
                            onChange={(e) => setSourceContent(e.target.value)}
                        />
                        <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-100 transition-opacity text-primary pointer-events-none">
                            <Sparkles className="w-6 h-6" />
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/10 text-destructive text-sm animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <p className="font-bold">{error}</p>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-3">
                    <Button variant="ghost" onClick={onClose} disabled={isGenerating} className="rounded-xl px-6">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleGenerate}
                        disabled={!sourceContent.trim() || isGenerating}
                        className="rounded-xl px-8 gap-3 bg-primary hover:bg-primary/95 text-primary-foreground font-bold shadow-lg shadow-primary/20"
                    >
                        {isGenerating ? (
                            <>
                                <Sparkles className="w-4 h-4 animate-spin" />
                                Analyzing Content...
                            </>
                        ) : (
                            <>
                                Generate Problem
                                <Brain className="w-4 h-4" />
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
