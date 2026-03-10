import * as React from "react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { Topic } from "@/lib/db/models";
import { Check as CheckIcon, FolderEdit, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "./badge";

interface BulkTopicEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (selectedTopicIds: string[]) => Promise<void>;
    topics: Topic[];
    itemCount: number;
    initialTopicIds?: string[];
}

export function BulkTopicEditModal({ isOpen, onClose, onSave, topics, itemCount, initialTopicIds = [] }: BulkTopicEditModalProps) {
    const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set(initialTopicIds));
    const [isSaving, setIsSaving] = useState(false);

    // Reset selection when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setSelectedTopics(new Set(initialTopicIds));
        }
    }, [isOpen, initialTopicIds]);

    const toggleTopic = (id: string) => {
        const newSet = new Set(selectedTopics);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedTopics(newSet);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onSave(Array.from(selectedTopics));
            onClose();
        } catch (error) {
            console.error("Failed to save bulk topics:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <FolderEdit className="w-5 h-5" />
                        </div>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/20">Bulk Action</Badge>
                    </div>
                    <DialogTitle className="text-2xl">Edit Topics</DialogTitle>
                    <DialogDescription>
                        Select the topics to apply to all <strong>{itemCount}</strong> selected items.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-2 max-h-[40vh] overflow-y-auto">
                    {topics.length === 0 ? (
                        <div className="text-center text-muted-foreground p-4">No topics available. Please create topics first.</div>
                    ) : (
                        topics.map(topic => {
                            const isSelected = selectedTopics.has(topic.id);
                            return (
                                <button
                                    key={topic.id}
                                    onClick={() => toggleTopic(topic.id)}
                                    className={cn(
                                        "w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left group",
                                        isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: topic.color }} />
                                        <span className={cn("font-medium", isSelected ? "text-foreground" : "text-muted-foreground group-hover:text-foreground")}>
                                            {topic.name}
                                        </span>
                                    </div>
                                    <div className={cn(
                                        "w-5 h-5 rounded border flex items-center justify-center transition-all",
                                        isSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30 text-transparent"
                                    )}>
                                        <CheckIcon className="w-3 h-3" />
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving || topics.length === 0} className="gap-2">
                        <Save className="w-4 h-4" />
                        {isSaving ? "Saving..." : "Apply Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
