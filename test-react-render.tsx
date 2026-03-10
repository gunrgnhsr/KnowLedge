import React from 'react';
import { renderToString } from 'react-dom/server';
import { MarkdownRenderer } from './src/components/ui/MarkdownRenderer';

const md = `\\begin{itemize}
\\item Level 1
    \\begin{itemize}
    \\item Level 2
        \\begin{itemize}
        \\item Low Freq
        \\end{itemize}
    \\end{itemize}
\\end{itemize}`;

try {
    const html = renderToString(React.createElement(MarkdownRenderer, { content: md }));
    console.log(html);
} catch (e) {
    console.error(e);
}
