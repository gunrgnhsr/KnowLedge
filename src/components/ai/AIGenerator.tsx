"use client";

import { useState, useRef, useEffect } from "react";
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
import { Brain, Sparkles, AlertCircle, Upload, X } from "lucide-react";
import { generateProblemFromContent } from "@/lib/ai/actions";
import { aiPrompts } from "@/lib/utils/ai-prompts";
import { MediaPreview } from "../ui/MediaPreview";
import { Concept } from "@/lib/db/models";

interface AIGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerated: (data: { question: string; solution: string; newConcepts?: { title: string; content: string }[] }) => void;
    initialContent?: string;
    relatedConcepts?: Concept[];
}

export function AIGenerator({ isOpen, onClose, onGenerated, initialContent = "", relatedConcepts = [] }: AIGeneratorProps) {
    const [sourceContent, setSourceContent] = useState(initialContent);
    const [file, setFile] = useState<{ name: string; type: string; data: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isOpen) {
            setFile(null);
            return;
        }
        if (initialContent) {
            setSourceContent(initialContent);
        }
        
        const pasteListener = (e: ClipboardEvent) => handlePaste(e);
        window.addEventListener("paste", pasteListener);
        return () => window.removeEventListener("paste", pasteListener);
    }, [isOpen, initialContent]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 10MB Limit
        if (file.size > 10 * 1024 * 1024) {
            setError("File is too large (max 10MB).");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            setFile({
                name: file.name,
                type: file.type,
                data: result.split(",")[1]
            });
        };
        reader.readAsDataURL(file);
    };

    const handlePaste = (e: React.ClipboardEvent | ClipboardEvent) => {
        const items = (e as any).clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
                const blob = items[i].getAsFile();
                if (!blob) continue;

                const reader = new FileReader();
                reader.onload = (event) => {
                    const result = event.target?.result as string;
                    setFile({
                        name: `pasted-image-${Date.now()}.png`,
                        type: "image/png",
                        data: result.split(",")[1]
                    });
                };
                reader.readAsDataURL(blob);
                break;
            }
        }
    };

    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!sourceContent.trim() && !file) return;

        setIsGenerating(true);
        setError(null);

        try {
            const prompt = aiPrompts.generateFromRawContent(sourceContent, relatedConcepts);
            const data = await generateProblemFromContent(
                prompt, 
                file ? { mimeType: file.type, data: file.data } : undefined
            );
            onGenerated(data);
            setSourceContent("");
            setFile(null);
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
                        Paste text, upload a document, or **paste a screenshot** directly. AI will transform it into a study problem.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-4">
                    <input 
                        type="file" 
                        style={{ display: 'none' }}
                        ref={fileInputRef} 
                        accept="image/*,application/pdf"
                        onChange={handleFileUpload}
                    />

                    <div className="relative group">
                        <Textarea
                            placeholder="Paste your source content or screenshot here..."
                            className="min-h-[200px] font-sans text-sm bg-muted/30 focus:bg-background transition-all resize-none rounded-2xl p-6 border-primary/5 focus:ring-primary/20"
                            value={sourceContent}
                            onChange={(e) => setSourceContent(e.target.value)}
                            onPaste={handlePaste}
                        />
                        <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-100 transition-opacity text-primary pointer-events-none">
                            <Sparkles className="w-6 h-6" />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-xl gap-2 border-primary/20 hover:bg-primary/5"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="w-4 h-4" />
                            Upload File / PDF
                        </Button>
                        <p className="text-[10px] text-muted-foreground uppercase font-black self-center tracking-widest opacity-50">
                            Tip: You can paste screenshots (Ctrl+V) directly
                        </p>
                    </div>

                    <MediaPreview 
                        file={file} 
                        onRemove={() => setFile(null)} 
                    />

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
                        disabled={(!sourceContent.trim() && !file) || isGenerating}
                        className="rounded-xl px-8 gap-3 bg-primary hover:bg-primary/95 text-primary-foreground font-bold shadow-lg shadow-primary/20"
                    >
                        {isGenerating ? (
                            <>
                                <Sparkles className="w-4 h-4 animate-spin" />
                                Analyzing Multi-Modal Content...
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
