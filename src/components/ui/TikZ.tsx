"use client";

import React, { useEffect, useRef } from "react";

interface TikZProps {
    code: string;
    className?: string;
}

// Global debouncer to prevent flooding the main thread with events
let tikzTriggerTimeout: NodeJS.Timeout | null = null;
const debouncedTikZTrigger = () => {
    if (tikzTriggerTimeout) clearTimeout(tikzTriggerTimeout);
    tikzTriggerTimeout = setTimeout(() => {
        window.dispatchEvent(new Event('load'));
        document.dispatchEvent(new Event('DOMContentLoaded'));
    }, 50); // Small delay to batch all mounted TikZ components into ONE single event
};

export const TikZ = React.memo(function TikZ({ code, className }: TikZProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;

        // Clear previous rendering carefully to avoid memory leaks
        while (containerRef.current.firstChild) {
            containerRef.current.removeChild(containerRef.current.firstChild);
        }

        // Create a new script element for TikZJax
        const script = document.createElement("script");
        script.type = "text/tikz";
        script.textContent = code;

        // Append to container
        containerRef.current.appendChild(script);

        // Instead of firing 5 timeouts per component (O(N) global events),
        // we use a single globally debounced call.
        debouncedTikZTrigger();

        // Also fire one highly delayed fallback just in case WASM was incredibly slow to load.
        const fallback = setTimeout(() => {
            debouncedTikZTrigger();
        }, 1500);

        return () => clearTimeout(fallback);
    }, [code]);

    return (
        <div
            ref={containerRef}
            className={`tikz-container flex justify-center p-6 bg-white rounded-xl overflow-x-auto min-h-[100px] shadow-lg border border-white/20 ${className || ""}`}
        />
    );
});
