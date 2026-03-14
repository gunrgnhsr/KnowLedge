"use client";

import { useState } from "react";
import { X, Image as ImageIcon, FileText, Maximize2, Trash2 } from "lucide-react";
import { Button } from "./button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "./dialog";
import { cn } from "@/lib/utils";

interface MediaPreviewProps {
    file: { name: string; type: string; data: string } | null;
    onRemove: () => void;
    className?: string;
}

export function MediaPreview({ file, onRemove, className }: MediaPreviewProps) {
    const [isEnlarged, setIsEnlarged] = useState(false);

    if (!file) return null;

    const isImage = file.type.startsWith("image/");
    const dataUrl = `data:${file.type};base64,${file.data}`;

    return (
        <div className={cn("group relative flex items-center justify-between p-3 bg-primary/5 rounded-xl border border-primary/10 animate-in slide-in-from-left-2", className)}>
            <div className="flex items-center gap-3">
                <div className="relative overflow-hidden rounded-lg border border-primary/20 bg-background">
                    {isImage ? (
                        <div 
                            className="w-12 h-12 cursor-pointer transition-all hover:scale-105"
                            onClick={() => setIsEnlarged(true)}
                        >
                            <img 
                                src={dataUrl} 
                                alt={file.name} 
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Maximize2 className="w-4 h-4 text-white" />
                            </div>
                        </div>
                    ) : (
                        <div className="w-12 h-12 flex items-center justify-center text-primary bg-primary/10">
                            <FileText className="w-6 h-6" />
                        </div>
                    )}
                </div>
                
                <div className="flex flex-col min-w-0 max-w-[200px]">
                    <span className="text-xs font-bold truncate">{file.name}</span>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                        {file.type.split("/")[1]} attached
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {isImage && (
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-primary hover:bg-primary/10"
                        onClick={() => setIsEnlarged(true)}
                    >
                        <Maximize2 className="w-4 h-4" />
                    </Button>
                )}
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive hover:bg-destructive/10" 
                    onClick={onRemove}
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>

            {isImage && (
                <Dialog open={isEnlarged} onOpenChange={setIsEnlarged}>
                    <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-black/90 border-none shadow-2xl">
                        <DialogHeader className="absolute top-4 right-4 z-50">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-white hover:bg-white/20 rounded-full"
                                onClick={() => setIsEnlarged(false)}
                            >
                                <X className="w-6 h-6" />
                            </Button>
                        </DialogHeader>
                        <div className="w-full h-full flex items-center justify-center p-8">
                            <img 
                                src={dataUrl} 
                                alt={file.name} 
                                className="max-w-full max-h-[85vh] object-contain shadow-2xl rounded-lg"
                            />
                        </div>
                        <div className="absolute bottom-4 left-0 right-0 text-center">
                            <span className="bg-black/60 text-white text-xs px-4 py-2 rounded-full backdrop-blur-md border border-white/10 uppercase font-black tracking-widest">
                                {file.name}
                            </span>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
