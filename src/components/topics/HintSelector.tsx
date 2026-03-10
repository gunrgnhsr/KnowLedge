"use client";

import * as React from "react";
import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/db/api";
import { Topic, Concept } from "@/lib/db/models";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, X, Lightbulb, Search, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface HintSelectorProps {
    parentTopicIds: string[];
    selectedHintIds: string[];
    onHintsChange: (hintIds: string[]) => void;
}

export function HintSelector({ parentTopicIds, selectedHintIds, onHintsChange }: HintSelectorProps) {
    const [allTopics, setAllTopics] = useState<Topic[]>([]);
    const [allConcepts, setAllConcepts] = useState<Concept[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    const loadData = async () => {
        const [tops, items] = await Promise.all([
            api.topics.list(),
            api.items.list()
        ]);
        setAllTopics(tops);
        setAllConcepts(items.filter((i): i is Concept => i.type === "concept"));
    };

    useEffect(() => {
        loadData();
    }, [parentTopicIds]);

    const toggleHint = (id: string) => {
        if (selectedHintIds.includes(id)) {
            onHintsChange(selectedHintIds.filter(hid => hid !== id));
        } else {
            onHintsChange([...selectedHintIds, id]);
        }
    };

    const availableConcepts = useMemo(() =>
        allConcepts.filter(c => parentTopicIds.length === 0 || (c.topicIds || []).some(tid => parentTopicIds.includes(tid))),
        [allConcepts, parentTopicIds]);

    const filteredSuggestions = useMemo(() => {
        const term = searchTerm.toLowerCase();
        if (!term) return [];
        return availableConcepts.filter(c =>
            c.title.toLowerCase().includes(term) &&
            !selectedHintIds.includes(c.id)
        );
    }, [searchTerm, availableConcepts, selectedHintIds]);

    if (parentTopicIds.length === 0) {
        return (
            <div className="text-sm text-muted-foreground italic bg-muted/30 p-4 rounded-lg border border-dashed text-center">
                Select at least one Topic first to manage Concept Hints.
            </div>
        );
    }

    return (
        <div className="space-y-4 border rounded-xl p-4 bg-background/50">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    <h3 className="text-sm font-semibold">Concept Hints</h3>
                </div>
            </div>

            {/* Selected Hints Display */}
            <div className="flex flex-wrap gap-2 min-h-[32px]">
                {selectedHintIds.map(id => {
                    const concept = allConcepts.find(c => c.id === id);
                    if (!concept) return null;
                    return (
                        <Badge key={`con-${id}`} variant="outline" className="pl-2 pr-1 py-1 border-primary/30 flex items-center gap-1 bg-primary/5 text-primary">
                            <BookOpen className="w-3 h-3 mr-1 opacity-60" />
                            {concept.title}
                            <button type="button" onClick={() => toggleHint(id)} className="hover:bg-primary/10 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                        </Badge>
                    );
                })}
                {selectedHintIds.length === 0 && <span className="text-xs text-muted-foreground italic">No concept hints added yet.</span>}
            </div>

            <div className="relative">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search concepts to use as hint..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 h-9"
                    />
                </div>

                {/* Search Result Dropdown */}
                {searchTerm && filteredSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 p-1 border rounded-md bg-popover shadow-md z-20 max-h-56 overflow-y-auto">
                        {filteredSuggestions.map(item => (
                            <button key={item.id} type="button" onClick={() => { toggleHint(item.id); setSearchTerm(""); }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm flex items-center justify-between group">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="w-3 h-3 text-primary opacity-60" />
                                    <span>{item.title}</span>
                                </div>
                                <Plus className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
