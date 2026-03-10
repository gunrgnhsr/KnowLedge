"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Brain, FileJson, AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AIImportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AIImportModal({ isOpen, onClose }: AIImportModalProps) {
    const router = useRouter();
    const [jsonInput, setJsonInput] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    const [errorContext, setErrorContext] = useState<{ snippet: string; marker: string } | null>(null);

    const handleImport = () => {
        setIsValidating(true);
        setError(null);
        setErrorContext(null);

        let sanitizedJson = "";
        try {
            let cleanedInput = jsonInput.trim();

            // Remove markdown code blocks if present
            if (cleanedInput.startsWith("```")) {
                cleanedInput = cleanedInput.replace(/^```[a-z]*\n/i, "").replace(/\n```$/, "");
            }

            // Find the first { and the last }
            const firstBrace = cleanedInput.indexOf("{");
            const lastBrace = cleanedInput.lastIndexOf("}");

            if (firstBrace === -1 || lastBrace === -1) {
                throw new Error("No valid JSON object found. Ensure the content starts with '{' and ends with '}'.");
            }

            let jsonString = cleanedInput.substring(firstBrace, lastBrace + 1);

            // Robustly escape literal newlines inside JSON string values
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
                    // Skip carriage returns inside strings
                } else {
                    sanitizedJson += char;
                }
            }

            const parsed = JSON.parse(sanitizedJson);

            // Basic validation
            if (!parsed.question || !parsed.solution) {
                throw new Error("The AI output is missing required fields ('question' or 'solution').");
            }

            // Post-process to fix AI confusion between text \n and real newlines
            // Only replace \n if it's NOT followed by a letter (to protect LaTeX like \nu, \newline)
            const fixNewlines = (text: string) => {
                if (typeof text !== "string") return text;
                // Replace literal \n\n with actual newlines first (repeating to catch overlap)
                let processed = text.replace(/\\n\\n/g, "\n\n");
                // Then handle single \n that are definitely newlines (not followed by letters)
                return processed.replace(/\\n(?![a-zA-Z])/g, "\n");
            };

            parsed.question = fixNewlines(parsed.question);
            parsed.solution = fixNewlines(parsed.solution);

            // Clean up suggestions
            parsed.existingConceptIds = Array.isArray(parsed.existingConceptIds) ? parsed.existingConceptIds : [];
            parsed.newConcepts = Array.isArray(parsed.newConcepts) ? parsed.newConcepts.map((nc: any) => ({
                title: nc.title || "Untitled Concept",
                content: fixNewlines(nc.content || "")
            })) : [];



            // Store in sessionStorage for the 'New Problem' page to pick up
            sessionStorage.setItem("ai_import_data", JSON.stringify(parsed));

            setIsValidating(false);
            onClose();
            router.push("/problems/new?import=ai");
        } catch (err: any) {
            let msg = err.message || "Invalid JSON format.";
            setError(msg);

            // Attempt to extract context if it's a JSON syntax error
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

            setIsValidating(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Brain className="w-5 h-5" />
                        </div>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/20">AI Integration</Badge>
                    </div>
                    <DialogTitle className="text-2xl">Import AI Result</DialogTitle>
                    <DialogDescription>
                        Paste the JSON output from your external AI model below. We'll automatically populate the problem form for you.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="relative group">
                        <Textarea
                            placeholder='{ "question": "...", "solution": "...", "existingConceptIds": [...], "newConcepts": [...] }'
                            className="min-h-[300px] font-mono text-xs bg-muted/30 focus:bg-background transition-colors resize-none"
                            value={jsonInput}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setJsonInput(e.target.value)}
                        />
                        <div className="absolute top-3 right-3 opacity-20 group-hover:opacity-100 transition-opacity">
                            <FileJson className="w-5 h-5 text-muted-foreground" />
                        </div>
                    </div>

                    {error && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                <p className="font-medium">{error}</p>
                            </div>

                            {errorContext && (
                                <div className="p-3 rounded-lg bg-black/90 text-white font-mono text-[10px] leading-tight overflow-x-auto border border-white/10">
                                    <div className="opacity-50 mb-1 border-b border-white/5 pb-1">Error Context:</div>
                                    <pre className="whitespace-pre">{errorContext.snippet}</pre>
                                    <pre className="text-destructive font-bold">{errorContext.marker}</pre>
                                </div>
                            )}
                        </div>
                    )}

                    {!error && jsonInput && (
                        <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 font-medium px-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Format looks good, ready to parse.
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="ghost" onClick={onClose} disabled={isValidating}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={!jsonInput || isValidating}
                        className="gap-2 shadow-lg shadow-primary/10"
                    >
                        {isValidating ? "Processing..." : "Continue to Editor"}
                        <Brain className="w-4 h-4" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
