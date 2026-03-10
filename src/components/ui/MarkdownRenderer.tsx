"use client";

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkBreaks from 'remark-breaks';
import 'katex/dist/katex.min.css';
import { TikZ } from "@/components/ui/TikZ";
import { preprocessLaTeX } from "@/lib/utils/latex-utils";
import { cn } from "@/lib/utils";
import { annotateSource, remarkSourceMap, rehypePreserveSync } from "@/lib/utils/source-mapping";

interface MarkdownRendererProps {
    content: string;
    className?: string;
    onDoubleClick?: (e: React.MouseEvent) => void;
}

const remarkPluginsList = [remarkMath, remarkBreaks, remarkSourceMap];
const rehypePluginsList = [rehypePreserveSync, rehypeKatex];

const markdownComponents: any = {
    code({ node, inline, className, children, ...props }: any) {
        const match = /language-(\w+)/.exec(className || '');
        const language = match ? match[1] : '';
        if (!inline && language === 'tikz') {
            return <TikZ code={String(children).replace(/\n$/, '')} />;
        }
        return (
            <code className={className} {...props}>
                {children}
            </code>
        );
    },
    ul({ children, ...props }: any) {
        return <ul className="list-disc pl-6 my-2 space-y-1" {...props}>{children}</ul>;
    },
    ol({ children, ...props }: any) {
        return <ol className="list-decimal pl-6 my-2 space-y-1" {...props}>{children}</ol>;
    },
    li({ children, ...props }: any) {
        return <li className="marker:text-primary leading-relaxed" {...props}>{children}</li>;
    },
    p({ children, ...props }: any) {
        return <p className="leading-relaxed" {...props}>{children}</p>;
    }
};

export const MarkdownRenderer = React.memo(function MarkdownRenderer({ content, className, onDoubleClick }: MarkdownRendererProps) {
    // 1. Tag source with line markers
    // 2. Preprocess LaTeX (now marker-aware)
    const processedContent = preprocessLaTeX(annotateSource(content));

    return (
        <div
            className={cn("prose prose-slate dark:prose-invert max-w-none", className)}
            onDoubleClick={onDoubleClick}
        >
            <ReactMarkdown
                remarkPlugins={remarkPluginsList}
                rehypePlugins={rehypePluginsList}
                components={markdownComponents}
            >
                {processedContent}
            </ReactMarkdown>
        </div>
    );
});
