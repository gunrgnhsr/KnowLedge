"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
    if (!open) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="relative w-full max-h-full flex flex-col items-center justify-center pointer-events-none"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="pointer-events-auto w-full flex flex-col items-center">
                    {children}
                </div>
            </div>
            <div className="absolute inset-0 -z-10" onClick={() => onOpenChange(false)} />
        </div>
    )
}

export function DialogContent({ children, className }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={cn(
            "relative w-full bg-card border border-border rounded-xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col p-6 gap-4 pointer-events-auto",
            className
        )}>
            {children}
        </div>
    )
}

export function DialogHeader({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={cn("flex flex-col gap-1.5", className)}>{children}</div>
}

export function DialogTitle({ children, className }: { children: React.ReactNode; className?: string }) {
    return <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>{children}</h2>
}

export function DialogDescription({ children, className }: { children: React.ReactNode; className?: string }) {
    return <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>
}

export function DialogFooter({ children, className }: { children: React.ReactNode; className?: string }) {
    return <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-2", className)}>{children}</div>
}
