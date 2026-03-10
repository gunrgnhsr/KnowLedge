"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Brain, Target, Play, GraduationCap, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExamSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: (settings: ExamSettings) => void;
    title: string;
    description: string;
    maxCount: number;
    hideSlider?: boolean;
}

export interface ExamSettings {
    count: number;
    isPractice: boolean;
    coverageMode: boolean;
}

export function ExamSettingsModal({ isOpen, onClose, onStart, title, description, maxCount, hideSlider }: ExamSettingsModalProps) {
    const [count, setCount] = useState(1);
    const [isPractice, setIsPractice] = useState(true);
    const [coverageMode, setCoverageMode] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setCount(Math.min(10, maxCount));
        }
    }, [isOpen, maxCount]);

    const handleStart = () => {
        onStart({
            count,
            isPractice,
            coverageMode
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none shadow-2xl">
                <div className="bg-primary/5 px-6 py-8 border-b border-primary/10">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                                <Target className="w-6 h-6" />
                            </div>
                            <DialogTitle className="text-2xl font-bold tracking-tight">Focused Exam</DialogTitle>
                        </div>
                        <DialogDescription className="text-base text-muted-foreground/80 leading-relaxed">
                            {description}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-8">
                    {/* Item Count */}
                    {!hideSlider && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70">Number of Questions</Label>
                                <span className="text-xl font-black text-primary bg-primary/10 px-3 py-1 rounded-lg tabular-nums">
                                    {count === maxCount ? "All" : count}
                                </span>
                            </div>
                            <Slider
                                value={[count]}
                                onValueChange={(v: number[]) => setCount(v[0])}
                                max={maxCount}
                                min={1}
                                step={1}
                                className="py-4"
                            />
                        </div>
                    )}

                    {/* Mode Selection */}
                    <div className="space-y-4">
                        <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70">Session Mode</Label>
                        <div className="space-y-2">
                            <div
                                className={cn(
                                    "flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer",
                                    isPractice ? "bg-secondary/40 border-secondary shadow-sm" : "border-border hover:bg-muted/50"
                                )}
                                onClick={() => setIsPractice(true)}
                            >
                                <div className="p-2 rounded-lg bg-background border flex items-center justify-center">
                                    <GraduationCap className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-sm">Practice Mode</div>
                                    <div className="text-xs text-muted-foreground">Focus on learning, no SRS impact</div>
                                </div>
                                {isPractice && <div className="w-2 h-2 rounded-full bg-primary" />}
                            </div>

                            <div
                                className={cn(
                                    "flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer",
                                    !isPractice ? "bg-primary/5 border-primary shadow-sm" : "border-border hover:bg-muted/50"
                                )}
                                onClick={() => setIsPractice(false)}
                            >
                                <div className="p-2 rounded-lg bg-background border flex items-center justify-center">
                                    <Target className="w-4 h-4 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <div className="font-bold text-sm">Real Exam</div>
                                    <div className="text-xs text-muted-foreground italic">Updates your spacing & mastery</div>
                                </div>
                                {!isPractice && <div className="w-2 h-2 rounded-full bg-primary" />}
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 bg-muted/30 border-t flex gap-3 sm:gap-0">
                    <Button variant="ghost" onClick={onClose} className="px-6 rounded-full font-bold">Cancel</Button>
                    <Button
                        onClick={handleStart}
                        disabled={maxCount === 0}
                        className="px-10 rounded-full font-bold shadow-lg shadow-primary/20 gap-2"
                    >
                        <Play className="w-4 h-4 fill-current" />
                        Start Exam
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
