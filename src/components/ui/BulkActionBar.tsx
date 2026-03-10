import * as React from "react";
import { Button } from "./button";
import { Trash2, FolderEdit, Play, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BulkActionBarProps {
    selectedCount: number;
    onClearSelection: () => void;
    onDelete: () => void;
    onEditTopics: () => void;
    onStartExam?: () => void;
    isMobile?: boolean;
}

export function BulkActionBar({
    selectedCount,
    onClearSelection,
    onDelete,
    onEditTopics,
    onStartExam,
    isMobile = false
}: BulkActionBarProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className={cn(
                "bg-card/95 backdrop-blur-xl border border-border shadow-2xl p-2 rounded-2xl flex items-center gap-2",
                isMobile ? "flex-col items-stretch p-3 min-w-[90vw]" : "flex-row min-w-[500px]"
            )}>
                {/* Selection Counter */}
                <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-xl mr-2">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                        {selectedCount}
                    </div>
                    <span className="text-sm font-semibold whitespace-nowrap">Selected</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-1 justify-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onEditTopics}
                        className="gap-2 h-10 hover:bg-primary/10 hover:text-primary transition-all"
                    >
                        <FolderEdit className="w-4 h-4" />
                        <span className="hidden sm:inline">Edit Topics</span>
                    </Button>

                    {onStartExam && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onStartExam}
                            className="gap-2 h-10 hover:bg-green-500/10 hover:text-green-600 transition-all"
                        >
                            <Play className="w-4 h-4 fill-current" />
                            <span className="hidden sm:inline">Start Exam</span>
                        </Button>
                    )}

                    <div className="w-px h-6 bg-border mx-1 hidden sm:block" />

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onDelete}
                        className="gap-2 h-10 hover:bg-destructive/10 hover:text-destructive text-destructive transition-all"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Delete</span>
                    </Button>
                </div>

                {/* Clear / Close */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClearSelection}
                    className="h-10 w-10 ml-2 rounded-xl text-muted-foreground hover:bg-muted"
                    title="Clear Selection"
                >
                    <X className="w-5 h-5" />
                </Button>
            </div>
        </div>
    );
}
