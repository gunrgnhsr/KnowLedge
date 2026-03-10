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
import { Textarea } from "../ui/textarea";
import { Copy, Check, ExternalLink, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AdaptPromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    promptText: string;
    topicName: string;
}

export function AdaptPromptModal({ isOpen, onClose, promptText, topicName }: AdaptPromptModalProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(promptText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/20">External Adaptation</Badge>
                    </div>
                    <DialogTitle className="text-2xl">Adapt External Problem</DialogTitle>
                    <DialogDescription>
                        Copy this prompt and use it with ChatGPT, Claude, or any AI to reformat content from other sources into a format compatible with our app.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold">Generated Prompt (for {topicName})</label>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs gap-1.5"
                                onClick={handleCopy}
                            >
                                {copied ? (
                                    <>
                                        <Check className="w-3.5 h-3.5 text-green-500" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3.5 h-3.5" />
                                        Copy Prompt
                                    </>
                                )}
                            </Button>
                        </div>
                        <div className="relative group">
                            <Textarea
                                readOnly
                                value={promptText}
                                className="min-h-[300px] font-mono text-xs bg-muted/30 focus:bg-muted/50 transition-colors resize-none border-dashed"
                            />
                        </div>
                    </div>

                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-xs text-muted-foreground flex items-start gap-2">
                        <ExternalLink className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                        <div>
                            <p className="font-semibold text-primary mb-1">How to use:</p>
                            <ol className="list-decimal pl-4 space-y-1">
                                <li>Copy the prompt above.</li>
                                <li>Paste it into your favorite AI model.</li>
                                <li>Paste the raw text of the problem you want to adapt after the prompt.</li>
                                <li>Return here and use the <strong>Import AI Result</strong> button to add the problem.</li>
                            </ol>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={onClose} className="w-full sm:w-auto">
                        Done
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
