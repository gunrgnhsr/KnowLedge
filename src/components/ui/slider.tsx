"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps {
    value: number[];
    onValueChange: (value: number[]) => void;
    min?: number;
    max?: number;
    step?: number;
    className?: string;
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
    ({ value, onValueChange, min = 0, max = 100, step = 1, className, ...props }, ref) => {
        const range = max - min;
        const percentage = range === 0 ? 100 : ((value[0] - min) / range) * 100;

        return (
            <div
                ref={ref}
                className={cn("relative flex w-full touch-none select-none items-center", className)}
                {...props}
            >
                <div className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
                    <div
                        className="absolute h-full bg-primary"
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value[0]}
                    onChange={(e) => onValueChange([parseInt(e.target.value)])}
                    className="absolute h-full w-full opacity-0 cursor-pointer"
                />
                <div
                    className="absolute h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 pointer-events-none"
                    style={{ left: `calc(${percentage}% - 10px)` }}
                />
            </div>
        );
    }
);
Slider.displayName = "Slider";

export { Slider };
