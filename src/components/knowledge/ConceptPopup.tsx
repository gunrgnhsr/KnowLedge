"use client";

import * as React from "react";
import { Concept } from "@/lib/db/models";
import { api } from "@/lib/db/api";
import { X, BookOpen, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";

interface ConceptPopupProps {
    concept: Concept | null;
    onClose: () => void;
}

export function ConceptPopup({ concept: initialConcept, onClose }: ConceptPopupProps) {
    const [concept, setConcept] = React.useState<Concept | null>(null);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        if (initialConcept) {
            if (!initialConcept.content) {
                setLoading(true);
                api.concepts.getById(initialConcept.id).then(fullConcept => {
                    setConcept(fullConcept);
                    setLoading(false);
                }).catch(err => {
                    console.error("Failed to fetch full concept:", err);
                    setLoading(false);
                });
            } else {
                setConcept(initialConcept);
            }
        } else {
            setConcept(null);
        }
    }, [initialConcept]);

    if (!initialConcept) return null;

    const displayConcept = concept || initialConcept;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/40 animate-in fade-in duration-200">
            <div
                className="w-full max-w-2xl bg-popover text-popover-foreground rounded-2xl shadow-2xl border border-border flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold leading-tight">{displayConcept.title}</h2>
                            <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground mt-0.5">
                                <span>Concept Reference</span>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {format(displayConcept.createdAt, 'MMM d, yyyy')}
                                </div>
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="rounded-full hover:bg-muted"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <p className="text-sm">Fetching full content...</p>
                        </div>
                    ) : (
                        <div className="prose dark:prose-invert max-w-none text-foreground prose-p:my-3 prose-headings:mb-4 prose-headings:mt-6 first:prose-headings:mt-0">
                            <MarkdownRenderer content={displayConcept.content || ""} />
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 bg-muted/30 border-t flex justify-end">
                    <Button onClick={onClose} variant="secondary" className="px-8">Close Reference</Button>
                </div>
            </div>
            {/* Backdrop click to close */}
            <div className="absolute inset-0 -z-10" onClick={onClose} />
        </div>
    );
}
