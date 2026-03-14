"use client";

import * as React from "react";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Brain, Sparkles, Copy, Check, ExternalLink, Zap, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AIChoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description: string;
    onGenerateDirect: () => void;
    onGenerateWithSource: () => void;
    onCopyPrompt: () => void;
    isGenerating?: boolean;
}

export function AIChoiceModal({
    isOpen,
    onClose,
    title,
    description,
    onGenerateDirect,
    onGenerateWithSource,
    onCopyPrompt,
    isGenerating = false,
}: AIChoiceModalProps) {
    const [copied, setCopied] = useState(false);
    const [showSourceQuery, setShowSourceQuery] = useState(false);

    const handleCopy = () => {
        onCopyPrompt();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md rounded-[2rem] border border-primary/10 shadow-2xl p-0 overflow-hidden">
                <div className="p-8 space-y-6">
                    <DialogHeader className="items-center text-center space-y-4">
                        <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                            <Brain className="w-8 h-8" />
                        </div>
                        <div className="space-y-2">
                            <DialogTitle className="text-2xl font-black tracking-tight">{title}</DialogTitle>
                            <DialogDescription className="text-sm font-medium text-muted-foreground italic">
                                {description}
                            </DialogDescription>
                        </div>
                    </DialogHeader>

                    {!showSourceQuery ? (
                        <div className="grid gap-3">
                            <Button
                                onClick={() => setShowSourceQuery(true)}
                                disabled={isGenerating}
                                className="h-16 rounded-2xl flex items-center justify-between px-6 bg-primary hover:bg-primary/95 text-primary-foreground shadow-lg shadow-primary/20 group transition-all hover:scale-[1.02]"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2 rounded-xl bg-white/20">
                                        {isGenerating ? (
                                            <Sparkles className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Zap className="w-5 h-5 fill-current" />
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold">{isGenerating ? "Gemini is writing..." : "Generate In-App"}</div>
                                        <div className="text-[10px] opacity-70">
                                            {isGenerating ? "Creating your study problem" : "Use Gemini 3.1 Flash-Lite"}
                                        </div>
                                    </div>
                                </div>
                                {!isGenerating && <Sparkles className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />}
                            </Button>

                            <Button
                                variant="outline"
                                onClick={handleCopy}
                                disabled={isGenerating}
                                className="h-16 rounded-2xl flex items-center justify-between px-6 border-primary/20 hover:bg-primary/5 group transition-all hover:scale-[1.02]"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                        <Copy className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold">{copied ? "Copied!" : "Get AI Prompt"}</div>
                                        <div className="text-[10px] text-muted-foreground">For ChatGPT, Claude, etc.</div>
                                    </div>
                                </div>
                                {copied ? (
                                    <Check className="w-5 h-5 text-green-500" />
                                ) : (
                                    <ExternalLink className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-4 transition-all duration-300">
                            <div className="text-center space-y-2 py-2">
                                <h3 className="font-bold text-lg">Use an external source?</h3>
                                <p className="text-sm text-muted-foreground">Do you want to base this problem on a screenshot or document?</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowSourceQuery(false);
                                        onGenerateDirect();
                                    }}
                                    disabled={isGenerating}
                                    className="h-24 rounded-2xl flex flex-col gap-2 border-primary/10 hover:bg-primary/5"
                                >
                                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                        <Zap className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold">No, Fast Flow</span>
                                </Button>
                                <Button
                                    onClick={() => {
                                        setShowSourceQuery(false);
                                        onGenerateWithSource();
                                    }}
                                    disabled={isGenerating}
                                    className="h-24 rounded-2xl flex flex-col gap-2 bg-primary hover:bg-primary/95 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.05]"
                                >
                                    <div className="p-2 rounded-xl bg-white/20">
                                        <Upload className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold">Yes, Attach</span>
                                </Button>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setShowSourceQuery(false)} className="text-[10px] uppercase tracking-widest font-bold opacity-50">
                                ← Go Back
                            </Button>
                        </div>
                    )}
                </div>

                <div className="bg-muted/30 p-4 border-t border-primary/5 flex justify-center">
                    <Button variant="ghost" onClick={() => {
                        setShowSourceQuery(false);
                        onClose();
                    }} disabled={isGenerating} className="rounded-xl text-xs font-bold uppercase tracking-widest opacity-50 hover:opacity-100">
                        Nevermind
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
