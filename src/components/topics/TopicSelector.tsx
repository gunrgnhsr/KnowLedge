"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { api } from "@/lib/db/api";
import { Topic } from "@/lib/db/models";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, X, Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopicSelectorProps {
    selectedTopicIds: string[];
    onTopicChange: (ids: string[]) => void;
}

export function TopicSelector({ selectedTopicIds, onTopicChange }: TopicSelectorProps) {
    const [allTopics, setAllTopics] = useState<Topic[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newTopicName, setNewTopicName] = useState("");
    const [newTopicColor, setNewTopicColor] = useState("#3b82f6"); // Default blue
    const [searchTerm, setSearchTerm] = useState("");

    const loadTopics = async () => {
        const topics = await api.topics.list();
        setAllTopics(topics);
    };

    useEffect(() => {
        loadTopics();
    }, []);

    const handleCreateTopic = async () => {
        if (!newTopicName.trim()) return;
        const newTopic = await api.topics.create({
            name: newTopicName,
            color: newTopicColor
        });
        setAllTopics([...allTopics, newTopic]);
        onTopicChange([...selectedTopicIds, newTopic.id]);
        setNewTopicName("");
        setIsCreating(false);
    };

    const toggleTopic = (id: string) => {
        if (selectedTopicIds.includes(id)) {
            onTopicChange(selectedTopicIds.filter(tid => tid !== id));
        } else {
            onTopicChange([...selectedTopicIds, id]);
        }
    };

    const selectedTopics = allTopics.filter(t => selectedTopicIds.includes(t.id));
    const filteredTopics = allTopics.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !selectedTopicIds.includes(t.id)
    );

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2 min-h-[32px]">
                {selectedTopics.map(topic => (
                    <Badge
                        key={topic.id}
                        style={{ backgroundColor: topic.color + '20', color: topic.color, borderColor: topic.color + '40' }}
                        className="pl-2 pr-1 py-1 flex items-center gap-1 group transition-all"
                    >
                        {topic.name}
                        <button
                            type="button"
                            onClick={() => toggleTopic(topic.id)}
                            className="hover:bg-foreground/10 rounded-full p-0.5"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </Badge>
                ))}
            </div>

            <div className="relative">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Find topics..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreating(!isCreating)}
                        size="icon"
                        className={cn(isCreating && "bg-accent text-accent-foreground")}
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>

                {isCreating && (
                    <div className="mt-2 p-3 border rounded-lg bg-card shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="grid grid-cols-[1fr,auto] gap-2">
                            <Input
                                placeholder="Topic name (e.g., Mathematics)"
                                value={newTopicName}
                                onChange={(e) => setNewTopicName(e.target.value)}
                                autoFocus
                            />
                            <div className="w-10 h-10 border rounded-md overflow-hidden relative cursor-pointer ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                                <input
                                    type="color"
                                    value={newTopicColor}
                                    onChange={(e) => setNewTopicColor(e.target.value)}
                                    className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 cursor-pointer"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setIsCreating(false)}>Cancel</Button>
                            <Button size="sm" onClick={handleCreateTopic}>Create & Select</Button>
                        </div>
                    </div>
                )}

                {!isCreating && searchTerm && filteredTopics.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 p-1 border rounded-md bg-popover shadow-md z-10 max-h-48 overflow-y-auto">
                        {filteredTopics.map(topic => (
                            <button
                                key={topic.id}
                                type="button"
                                onClick={() => {
                                    toggleTopic(topic.id);
                                    setSearchTerm("");
                                }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm flex items-center gap-2 group"
                            >
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: topic.color }} />
                                {topic.name}
                                <Plus className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-50 transition-opacity" />
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
