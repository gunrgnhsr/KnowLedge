"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Square } from 'lucide-react';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-markdown';
import 'prismjs/themes/prism.css'; // or your preferred theme

interface MarkdownEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
    className?: string;
}

export function MarkdownEditor({ content, onChange, placeholder, className }: MarkdownEditorProps) {
    const [activeTab, setActiveTab] = useState('write');
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    // Insert helper
    const insertText = (before: string, after: string = '') => {
        // Find the textarea element managed by the code editor
        const textarea = document.getElementById('code-editor-textarea') as HTMLTextAreaElement | null;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selected = content.substring(start, end);

        const newText = content.substring(0, start) + before + selected + after + content.substring(end);
        onChange(newText);

        // Re-focus and set cursor position
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
        }, 0);
    };

    // Add custom basic LaTeX tokens to Markdown grammar
    useEffect(() => {
        if (Prism.languages.markdown && !(Prism.languages.markdown as any).latex) {
            (Prism.languages.markdown as any).latex = {
                pattern: /(\$\$[\s\S]*?\$\$|\$(?!\$)[\s\S]*?\$|\\begin\{[\s\S]*?\}(?:[\s\S]*?)\\end\{[\s\S]*?\})/g,
                inside: {
                    keyword: /\$\$|\$|\\begin\{[\w*]+\}|\\end\{[\w*]+\}/,
                    function: /\\[a-zA-Z]+/,
                    punctuation: /[{}[\]()]/
                }
            };
        }
    }, []);

    const highlightWithPrism = (code: string) => {
        return Prism.highlight(code, Prism.languages.markdown, 'markdown');
    };

    return (
        <div className={cn("flex flex-col border border-input rounded-md overflow-hidden bg-background h-full", className)}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <div className="bg-muted px-3 py-2 border-b border-input flex items-center justify-between shrink-0">
                    <TabsList className="bg-transparent h-8 p-0 space-x-2">
                        <TabsTrigger
                            value="write"
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded px-3 py-1 text-xs"
                        >
                            Write (Markdown/LaTeX)
                        </TabsTrigger>
                        <TabsTrigger
                            value="preview"
                            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded px-3 py-1 text-xs"
                        >
                            Live Preview
                        </TabsTrigger>
                    </TabsList>

                    {/* Toolbar (Only show in Write mode) */}
                    {activeTab === 'write' && (
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => insertText('**', '**')}
                                className="p-1 rounded text-xs hover:bg-accent hover:text-accent-foreground font-bold h-7 w-7"
                            >
                                B
                            </button>
                            <button
                                type="button"
                                onClick={() => insertText('*', '*')}
                                className="p-1 rounded text-xs hover:bg-accent hover:text-accent-foreground italic h-7 w-7"
                            >
                                I
                            </button>
                            <button
                                type="button"
                                onClick={() => insertText('$', '$')}
                                className="p-1 rounded text-xs hover:bg-accent hover:text-accent-foreground font-mono px-2 h-7"
                                title="Inline Math"
                            >
                                $
                            </button>
                            <button
                                type="button"
                                onClick={() => insertText('$$ \n', '\n$$')}
                                className="p-1 rounded text-xs hover:bg-accent hover:text-accent-foreground font-mono px-2 h-7"
                                title="Math Block"
                            >
                                $$
                            </button>
                            <button
                                type="button"
                                onClick={() => insertText('\\begin{tikzpicture}\n  ', '\n\\end{tikzpicture}')}
                                className="p-1 rounded text-xs hover:bg-accent hover:text-accent-foreground font-mono px-2 h-7"
                                title="TikZ Diagram"
                            >
                                <Square className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => insertText('```javascript\n', '\n```')}
                                className="p-1 rounded text-xs hover:bg-accent hover:text-accent-foreground font-mono px-2 h-7"
                                title="Code Block"
                            >
                                {'</>'}
                            </button>
                        </div>
                    )}
                </div>

                <TabsContent value="write" className="flex-1 m-0 p-0 outline-none relative bg-transparent overflow-hidden">
                    <div
                        ref={scrollContainerRef}
                        className="absolute inset-0 overflow-auto scrollbar-thin scrollbar-thumb-primary/20 hover:scrollbar-thumb-primary/40"
                    >
                        <Editor
                            value={content}
                            onValueChange={onChange}
                            highlight={highlightWithPrism}
                            padding={16}
                            textareaId="code-editor-textarea"
                            placeholder={placeholder || 'Support Markdown and LaTeX ($$ E=mc^2 $$)...'}
                            className="font-mono text-sm leading-relaxed min-h-full"
                            style={{
                                fontFamily: 'ui-monospace, SFMono-Regular, Roboto Mono, monospace',
                                fontSize: 14,
                                outline: 'none',
                                backgroundColor: 'transparent',
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Tab') {
                                    e.preventDefault();
                                    const textarea = e.currentTarget as HTMLTextAreaElement;
                                    const { selectionStart, selectionEnd, value } = textarea;

                                    const isShift = e.shiftKey;
                                    const indentStr = '  '; // 2 spaces

                                    if (selectionStart !== selectionEnd) {
                                        // Multi-line selection
                                        const startOfLine = value.lastIndexOf('\n', selectionStart - 1) + 1;
                                        let endOfLine = value.indexOf('\n', selectionEnd);
                                        if (endOfLine === -1) endOfLine = value.length;

                                        const selectedLines = value.substring(startOfLine, endOfLine).split('\n');
                                        let newLines;

                                        if (isShift) {
                                            // Outdent
                                            newLines = selectedLines.map(line =>
                                                line.startsWith(indentStr) ? line.substring(indentStr.length) : (line.startsWith(' ') ? line.substring(1) : line)
                                            );
                                        } else {
                                            // Indent
                                            newLines = selectedLines.map(line => indentStr + line);
                                        }

                                        const newContent = value.substring(0, startOfLine) + newLines.join('\n') + value.substring(endOfLine);
                                        onChange(newContent);

                                        // Restore selection
                                        const changedDiff = newLines.join('\n').length - selectedLines.join('\n').length;
                                        setTimeout(() => {
                                            textarea.setSelectionRange(selectionStart + (isShift ? (newLines[0].length - selectedLines[0].length) : indentStr.length), selectionEnd + changedDiff);
                                        }, 0);
                                    } else {
                                        // Single line or no selection
                                        if (isShift) {
                                            // Simple outdent at start of line
                                            const startOfLine = value.lastIndexOf('\n', selectionStart - 1) + 1;
                                            const line = value.substring(startOfLine, selectionStart);
                                            if (line.startsWith(indentStr)) {
                                                const newContent = value.substring(0, startOfLine) + value.substring(startOfLine + indentStr.length);
                                                onChange(newContent);
                                                setTimeout(() => textarea.setSelectionRange(selectionStart - indentStr.length, selectionStart - indentStr.length), 0);
                                            } else if (line.startsWith(' ')) {
                                                const newContent = value.substring(0, startOfLine) + value.substring(startOfLine + 1);
                                                onChange(newContent);
                                                setTimeout(() => textarea.setSelectionRange(selectionStart - 1, selectionStart - 1), 0);
                                            }
                                        } else {
                                            // Simple tab
                                            const newContent = value.substring(0, selectionStart) + indentStr + value.substring(selectionEnd);
                                            onChange(newContent);
                                            setTimeout(() => textarea.setSelectionRange(selectionStart + indentStr.length, selectionStart + indentStr.length), 0);
                                        }
                                    }
                                }
                            }}
                        />
                    </div>
                </TabsContent>

                <TabsContent value="preview" className="flex-1 m-0 p-0 overflow-hidden h-full bg-card relative flex flex-col">
                    <div className="flex-1 p-4 overflow-y-auto">
                        {content.trim() ? (
                            <MarkdownRenderer
                                content={content}
                                onDoubleClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();

                                    let target = e.target as HTMLElement | null;
                                    let lineStr: string | null = null;

                                    // Traverse up to find data-line
                                    while (target && target !== e.currentTarget) {
                                        lineStr = target.getAttribute('data-line');
                                        if (lineStr) break;
                                        target = target.parentElement;
                                    }

                                    console.log('--- Sync Triggered ---');
                                    console.log('Target element:', e.target);
                                    console.log('Found data-line:', lineStr);

                                    if (lineStr) {
                                        const lineNum = parseInt(lineStr, 10);
                                        if (!isNaN(lineNum)) {
                                            setActiveTab('write');

                                            // Robust multi-stage jump
                                            setTimeout(() => {
                                                const textarea = document.getElementById('code-editor-textarea') as HTMLTextAreaElement | null;
                                                const container = scrollContainerRef.current;

                                                if (textarea && container) {
                                                    const lines = content.split('\n');
                                                    let charIndex = 0;
                                                    for (let i = 0; i < lineNum - 1; i++) {
                                                        charIndex += (lines[i]?.length || 0) + 1;
                                                    }
                                                    const lineLength = lines[lineNum - 1]?.length || 0;

                                                    console.log(`Jumping to Line ${lineNum}, CharIndex ${charIndex}, length ${lineLength}`);

                                                    textarea.focus();
                                                    textarea.setSelectionRange(charIndex, charIndex + lineLength);

                                                    // Top-align the line instead of centering
                                                    const lineHeight = 21;
                                                    // Start with (lineNum - 1) * lineHeight
                                                    // We subtract a small amount (like 8px) to show a tiny bit of context/padding
                                                    const targetScroll = (lineNum - 1) * lineHeight;

                                                    container.scrollTo({
                                                        top: Math.max(0, targetScroll),
                                                        behavior: 'smooth'
                                                    });

                                                    // Force another focus after a short delay for safety
                                                    setTimeout(() => textarea.focus(), 50);
                                                }
                                            }, 100);
                                            return;
                                        }
                                    } else {
                                        console.warn('No data-line attribute found in traversal up to preview container.');
                                    }

                                    setActiveTab('write');
                                }}
                            />
                        ) : (
                            <div className="text-muted-foreground text-sm italic h-full flex items-center justify-center">
                                Nothing to preview
                            </div>
                        )}
                    </div>
                    {content.trim() && (
                        <div className="px-3 py-1.5 bg-muted/50 border-t text-[10px] text-muted-foreground flex items-center gap-2">
                            <span className="flex h-2 w-2 rounded-full bg-primary/40 animate-pulse"></span>
                            Tip: Double-click any text in the preview to jump to its location in the editor.
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
