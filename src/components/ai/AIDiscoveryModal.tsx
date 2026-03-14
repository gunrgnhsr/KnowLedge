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
import { discoverConceptsFromContent } from "@/lib/ai/actions";
import { aiPrompts } from "@/lib/utils/ai-prompts";
import { MediaPreview } from "../ui/MediaPreview";
import { Topic, Concept } from "@/lib/db/models";

interface AIDiscoveryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDiscovered: (data: { concepts: { title: string; content: string }[] }) => void;
    topic: Topic;
    existingConcepts: Concept[];
}

export function AIDiscoveryModal({ isOpen, onClose, onDiscovered, topic, existingConcepts }: AIDiscoveryModalProps) {
    const [sourceContent, setSourceContent] = useState("");
    const [file, setFile] = useState<{ name: string; type: string; data: string } | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isOpen) {
            setFile(null);
            setSourceContent("");
            setError(null);
            return;
        }
        
        const pasteListener = (e: ClipboardEvent) => handlePaste(e);
        window.addEventListener("paste", pasteListener);
        return () => window.removeEventListener("paste", pasteListener);
    }, [isOpen]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

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

    const handleDiscover = async () => {
        if (!sourceContent.trim() && !file) {
            setError("Please provide some text or an attachment to analyze.");
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const prompt = aiPrompts.discoverConcepts(topic, existingConcepts) + 
                           (sourceContent ? `\n\nEXTRA SOURCE TEXT:\n${sourceContent}` : "");
            
            const data = await discoverConceptsFromContent(
                prompt,
                file ? { mimeType: file.type, data: file.data } : undefined
            );
            onDiscovered(data);
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to discover concepts.");
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
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight">Discover in "{topic.name}"</h2>
                    </div>
                    <DialogDescription className="text-base text-muted-foreground font-medium">
                        Upload a syllabus, lecture notes, or **paste a screenshot** from your curriculum. Gemini will find what's missing.
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
                            <Brain className="w-6 h-6" />
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
                            Upload PDF / Image
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
                        onClick={handleDiscover}
                        disabled={(!sourceContent.trim() && !file) || isGenerating}
                        className="rounded-xl px-8 gap-3 bg-primary hover:bg-primary/95 text-primary-foreground font-bold shadow-lg shadow-primary/20"
                    >
                        {isGenerating ? (
                            <>
                                <Sparkles className="w-4 h-4 animate-spin" />
                                Analyzing Sources...
                            </>
                        ) : (
                            <>
                                Discover Missing Concepts
                                <Sparkles className="w-4 h-4" />
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
