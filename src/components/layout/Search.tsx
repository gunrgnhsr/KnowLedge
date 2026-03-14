"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/db/api";
import { StudyItem, Topic } from "@/lib/db/models";
import { Search as SearchIcon, X, FileText, Layers, Command } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function GlobalSearch() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<StudyItem[]>([]);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const loadTopics = useCallback(async () => {
        const allTopics = await api.topics.list();
        setTopics(allTopics);
    }, []);

    useEffect(() => {
        loadTopics();
    }, [loadTopics]);

    // Handle shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === "Escape") {
                setIsOpen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Perform search
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const debounce = setTimeout(async () => {
            setLoading(true);
            const allItems = await api.items.list();
            const filtered = allItems.filter(item => {
                const title = item.type === "concept" ? item.title : item.question;
                return title.toLowerCase().includes(query.toLowerCase());
            }).slice(0, 8); // Limit results
            setResults(filtered);
            setLoading(false);
        }, 150);

        return () => clearTimeout(debounce);
    }, [query]);

    const handleSelect = (item: StudyItem) => {
        const path = item.type === "concept" ? `/knowledge/edit/${item.id}` : `/problems/edit/${item.id}`;
        router.push(path);
        setIsOpen(false);
        setQuery("");
    };

    if (!isOpen) return (
        <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-muted/40 hover:bg-muted/60 rounded-xl transition-all border border-border/50 hover:border-primary/30 w-10 h-10 md:w-full md:h-auto overflow-hidden group justify-center md:justify-start shadow-sm"
            title="Search (⌘K)"
        >
            <SearchIcon className="w-5 h-5 md:w-4 md:h-4 shrink-0 transition-colors group-hover:text-primary" />
            <span className="hidden md:inline font-medium">Search...</span>
            <kbd className="hidden md:ml-auto md:pointer-events-none md:inline-flex md:h-5 md:select-none md:items-center md:gap-1 md:rounded md:border md:bg-background md:px-1.5 md:font-mono md:text-[10px] md:font-medium md:opacity-100 shadow-sm border-border/60">
                <span className="text-[10px]">⌘</span>K
            </kbd>
        </button>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 backdrop-blur-sm bg-black/20 animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-popover text-popover-foreground rounded-xl shadow-2xl border border-border overflow-hidden animate-in slide-in-from-top-4 duration-300">
                <div className="flex items-center px-4 py-3 border-b">
                    <SearchIcon className="w-5 h-5 text-muted-foreground mr-3" />
                    <input
                        autoFocus
                        placeholder="Search concepts, problems, formulas..."
                        className="flex-1 bg-transparent border-none outline-none text-lg placeholder:text-muted-foreground"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1 rounded-md hover:bg-muted text-muted-foreground"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {query && !loading && results.length === 0 && (
                        <div className="py-12 text-center text-muted-foreground">
                            <p>No results found for "{query}"</p>
                        </div>
                    )}

                    {!query && (
                        <div className="py-8 text-center text-muted-foreground space-y-2">
                            <Command className="w-8 h-8 mx-auto opacity-20" />
                            <p className="text-sm">Search across your entire knowledge base</p>
                        </div>
                    )}

                    {results.length > 0 && (
                        <div className="space-y-1">
                            {results.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => handleSelect(item)}
                                    className="w-full text-left px-3 py-3 rounded-lg hover:bg-accent hover:text-accent-foreground flex items-center gap-4 transition-colors group"
                                >
                                    <div className="p-2 rounded-md bg-muted group-hover:bg-background transition-colors">
                                        {item.type === "concept" ? <FileText className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">
                                            {item.type === "concept" ? item.title : item.question.split("\n")[0]}
                                        </div>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            <Badge variant="outline" className="text-[10px] uppercase h-4 py-0 border-none bg-muted/50">
                                                {item.type}
                                            </Badge>
                                            {(item.topicIds || []).map(tid => {
                                                const topic = topics.find(t => t.id === tid);
                                                if (!topic) return null;
                                                return (
                                                    <Badge
                                                        key={tid}
                                                        className="text-[10px] uppercase h-4 py-0 border-none"
                                                        style={{ backgroundColor: topic.color + '20', color: topic.color }}
                                                    >
                                                        {topic.name}
                                                    </Badge>
                                                )
                                            })}
                                        </div>
                                    </div>
                                    <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                        Edit →
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="px-4 py-2 bg-muted/50 border-t flex items-center justify-between text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><kbd className="border bg-background px-1 rounded">↑↓</kbd> Navigate</span>
                        <span className="flex items-center gap-1"><kbd className="border bg-background px-1 rounded">Enter</kbd> Select</span>
                    </div>
                    <span>{results.length} results</span>
                </div>
            </div>

            {/* Backdrop click to close */}
            <div className="absolute inset-0 -z-10" onClick={() => setIsOpen(false)} />
        </div>
    );
}
