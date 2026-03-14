"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Upload, FileText, Image as ImageIcon, Send, Trash2, X, Check, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { MediaPreview } from "./MediaPreview";

interface SolutionCaptureProps {
    onCheck: (text: string, media?: { mimeType: string; data: string }) => Promise<any>;
    isChecking: boolean;
}

export function SolutionCapture({ onCheck, isChecking }: SolutionCaptureProps) {
    const [text, setText] = useState("");
    const [file, setFile] = useState<{ name: string; type: string; data: string } | null>(null);
    const [feedback, setFeedback] = useState<{ isCorrect: "Correct" | "Incorrect" | "Partial"; feedback: string; correction: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 10MB Limit
        if (file.size > 10 * 1024 * 1024) {
            setError("File is too large (max 10MB). Please use a smaller image or a PDF.");
            console.error("SolutionCapture: File too large", file.size);
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
                    console.log("SolutionCapture: Image pasted from clipboard");
                };
                reader.readAsDataURL(blob);
                break;
            }
        }
    };

    const handleSubmit = async () => {
        if (!text && !file) {
            setError("Please provide a text solution, paste a screenshot, or upload a file.");
            return;
        }

        setError(null);
        setFeedback(null);
        try {
            const result = await onCheck(text, file ? { mimeType: file.type, data: file.data } : undefined);
            setFeedback(result);
        } catch (err) {
            console.error("Check failed:", err);
            setError("AI verification failed. Please try again.");
        }
    };

    const clearAll = () => {
        setText("");
        setFile(null);
        setFeedback(null);
        setError(null);
    };

    useEffect(() => {
        console.log("SolutionCapture: Component mounted");
        const pasteListener = (e: ClipboardEvent) => handlePaste(e);
        window.addEventListener("paste", pasteListener);
        return () => window.removeEventListener("paste", pasteListener);
    }, []);

    return (
        <Card className="border-primary/20 bg-muted/30 shadow-none overflow-hidden" onPaste={handlePaste}>
            <CardHeader className="py-3 px-6 bg-muted/50 border-b border-border">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-primary">
                    <Sparkles className="w-4 h-4" />
                    AI Answer Checker
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                {feedback ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                        <div className={cn(
                            "p-4 rounded-2xl border flex items-start gap-3",
                            feedback.isCorrect === "Correct" ? "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400" :
                            feedback.isCorrect === "Partial" ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-500" :
                            "bg-destructive/10 border-destructive/20 text-destructive"
                        )}>
                            {feedback.isCorrect === "Correct" ? <Check className="w-5 h-5 mt-0.5 shrink-0" /> :
                             feedback.isCorrect === "Partial" ? <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" /> :
                             <X className="w-5 h-5 mt-0.5 shrink-0" />}
                            <div>
                                <h4 className="font-bold uppercase text-xs tracking-wider mb-1">AI Feedback: {feedback.isCorrect}</h4>
                                <p className="text-sm opacity-90">{feedback.feedback}</p>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-muted/50 border border-border shadow-inner">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Tutor's Correction</h4>
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                <MarkdownRenderer content={feedback.correction} />
                            </div>
                        </div>

                        <Button 
                            variant="outline" 
                            className="w-full rounded-xl hover:bg-primary/10 hover:text-primary border-primary/20"
                            onClick={clearAll}
                        >
                            Try Another Way / Reset
                        </Button>
                    </div>
                ) : (
                    <>
                        <input 
                            type="file" 
                            style={{ display: 'none' }}
                            ref={fileInputRef} 
                            accept="image/*,application/pdf"
                            onChange={(e) => {
                                console.log("SolutionCapture: Internal input change detected");
                                handleFileUpload(e);
                            }}
                        />
                        <Tabs 
                            defaultValue="text" 
                            className="w-full"
                            onValueChange={(val) => {
                                console.log("SolutionCapture: Tab changed to", val);
                            }}
                        >
                            <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-xl mb-4">
                                <TabsTrigger value="text" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Text
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="file" 
                                    className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                                    onClick={() => {
                                        console.log("SolutionCapture: File tab clicked");
                                        fileInputRef.current?.click();
                                    }}
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload / Paste
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="text" className="mt-0">
                                <div className="space-y-2">
                                    <Textarea
                                        placeholder="Type your solution or paste a screenshot directly here..."
                                        className="min-h-[120px] rounded-xl border-border/50 focus-visible:ring-primary shadow-inner bg-background"
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                        onPaste={handlePaste}
                                    />
                                    <p className="text-[10px] text-muted-foreground text-center uppercase font-bold opacity-60">
                                        Tip: You can paste screenshots (Ctrl+V) anytime
                                    </p>
                                </div>
                            </TabsContent>

                            <TabsContent value="file" className="mt-0 space-y-4">
                                <button 
                                    type="button"
                                    className="w-full border-2 border-dashed border-border/50 rounded-2xl p-8 text-center hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group flex flex-col items-center gap-2"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        console.log("SolutionCapture: Main file area clicked");
                                        fileInputRef.current?.click();
                                    }}
                                >
                                    <div className="p-3 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform pointer-events-none">
                                        <Upload className="w-6 h-6" />
                                    </div>
                                    <p className="text-sm font-medium text-foreground pointer-events-none">Click to upload, or paste a screenshot</p>
                                    <p className="text-xs text-muted-foreground pointer-events-none">Supports PDF, PNG, JPG</p>
                                </button>
                            </TabsContent>
                        </Tabs>

                        <MediaPreview 
                            file={file} 
                            onRemove={() => setFile(null)} 
                        />

                        {error && (
                            <p className="text-xs text-destructive font-medium flex items-center gap-1.5 animate-bounce">
                                <AlertCircle className="w-3.5 h-3.5" />
                                {error}
                            </p>
                        )}

                        <Button 
                            className="w-full h-12 rounded-xl text-md font-bold shadow-lg shadow-primary/20 gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                            disabled={isChecking || (!text && !file)}
                            onClick={handleSubmit}
                        >
                            {isChecking ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    AI is analyzing...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Check Solution with AI
                                </>
                            )}
                        </Button>
                        <canvas ref={canvasRef} className="hidden" />
                    </>
                )}
            </CardContent>
        </Card>
    );
}
