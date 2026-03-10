// Robust regex that handles ZWS, missing ZWS, and potential internal whitespace/formatting
const MARKER_REGEX_STR = '(?:\\u200B?\\s*§SL\\s*:\\s*\\d+\\s*§\\u200B?)';
const TRAILING_MARKER_REGEX = /(\\u200B?\\s*§SL\\s*:\\s*(\d+)\\s*§\\u200B?)$/;

/**
 * Preprocesses markdown content to handle LaTeX environments that 
 * KaTeX or ReactMarkdown might not handle correctly by default.
 */
export function preprocessLaTeX(content: string): string {
    if (!content) return content;

    let processed = content;

    // Helper to strip markers from a string
    const strip = (s: string) => s.replace(new RegExp(MARKER_REGEX_STR, 'g'), '');

    // 1. Consolidate TikZ rendering (Inject marker INSIDE the block, preserve indent)
    const tikzEnvRegex = /^(\s*)(\\u200B?\s*§SL\s*:\s*\d+\s*§\\u200B?)?\\{1,2}begin\{tikzpicture\}(\\u200B?\s*§SL\s*:\s*\d+\s*§\\u200B?)?([\s\S]*?)\\end\{tikzpicture\}(\\u200B?\s*§SL\s*:\s*\d+\s*§\\u200B?)?/gm;
    processed = processed.replace(tikzEnvRegex, (match, indent, mBeforeOpen, mAfterOpen, body, mAfterClose) => {
        const marker = mBeforeOpen || mAfterOpen || mAfterClose || '';
        const cleanBody = strip(body);
        return `\n\n${indent}\`\`\`tikz\n${indent}${marker.trim()}\n${indent}\\begin{tikzpicture}${cleanBody}\\end{tikzpicture}\n${indent}\`\`\`\n\n`;
    });

    // 2. Handle block math $$ (Inject marker INSIDE the block, preserve indent)
    const blockMathRegex = /^(\s*)(\u200B?\s*§SL\s*:\s*\d+\s*§\u200B?)?\$\$(\u200B?\s*§SL\s*:\s*\d+\s*§\u200B?)?\s*([\s\S]*?)\s*\$\$(\u200B?\s*§SL\s*:\s*\d+\s*§\u200B?)?/gm;
    processed = processed.replace(blockMathRegex, (match, indent, mBeforeOpen, mAfterOpen, body, mAfterClose) => {
        const marker = mBeforeOpen || mAfterOpen || mAfterClose || '';
        const cleanBody = strip(body);
        return `\n\n${indent}$$\n${indent}${marker.trim()}\n${indent}${cleanBody.trim()}\n${indent}$$\n\n`;
    });

    // 3. Handle raw display math environments (Inject marker INSIDE the block, preserve indent)
    const alignRegex = /^(\s*)(\\u200B?\s*§SL\s*:\s*\d+\s*§\\u200B?)?\\begin\{align\*?\}(\\u200B?\s*§SL\s*:\s*\d+\s*§\\u200B?)?([\s\S]*?)\\end\{align\*?\}(\\u200B?\s*§SL\s*:\s*\d+\s*§\\u200B?)?/gm;
    processed = processed.replace(alignRegex, (match, indent, mBeforeOpen, mAfterOpen, body, mAfterClose) => {
        const marker = mBeforeOpen || mAfterOpen || mAfterClose || '';
        const cleanBody = strip(body);
        return `\n\n${indent}$$\n${indent}${marker.trim()}\n${indent}\\begin{aligned}${cleanBody}\\end{aligned}\n${indent}$$\n\n`;
    });

    const equationRegex = /^(\s*)(\\u200B?\s*§SL\s*:\s*\d+\s*§\\u200B?)?\\begin\{equation\*?\}(\\u200B?\s*§SL\s*:\s*\d+\s*§\\u200B?)?([\s\S]*?)\\end\{equation\*?\}(\\u200B?\s*§SL\s*:\s*\d+\s*§\\u200B?)?/gm;
    processed = processed.replace(equationRegex, (match, indent, mBeforeOpen, mAfterOpen, body, mAfterClose) => {
        const marker = mBeforeOpen || mAfterOpen || mAfterClose || '';
        const cleanBody = strip(body);
        return `\n\n${indent}$$\n${indent}${marker.trim()}\n${indent}${cleanBody.trim()}\n${indent}$$\n\n`;
    });

    // 4. Basic formatting
    processed = processed.replace(/\\textbf\{([^}]+)\}/g, '**$1**');
    processed = processed.replace(/\\textit\{([^}]+)\}/g, '*$1*');
    processed = processed.replace(/\\subsection\*?\{([^}]+)\}(\\u200B?\s*§SL\s*:\\s*(\d+)\s*§\\u200B?)?/g, '\n### $1 $2\n');
    processed = processed.replace(/\\subsubsection\*?\{([^}]+)\}(\\u200B?\s*§SL\s*:\\s*(\d+)\s*§\\u200B?)?/g, '\n#### $1 $2\n');

    // 5. Structural List Processing
    processed = processStructuralLists(processed);

    // 6. Final Cleanup
    processed = processed.replace(/\n{4,}/g, '\n\n\n');
    processed = processed.replace(/\n{3,}/g, '\n\n');

    return processed;
}

/**
 * Process lists line-by-line to handle multi-line content indentation correctly.
 */
function processStructuralLists(content: string): string {
    const lines = content.split('\n');
    const stack: { type: 'itemize' | 'enumerate', count: number }[] = [];
    const result: string[] = [];

    for (let line of lines) {
        const markerMatch = line.match(TRAILING_MARKER_REGEX);
        const marker = markerMatch ? markerMatch[1] : '';
        const lineContent = marker ? line.substring(0, line.length - marker.length) : line;
        const trimmed = lineContent.trim();

        const beginMatch = trimmed.match(/^\\begin\{(itemize|enumerate)\}(?:\[.*?\])?/);
        if (beginMatch) {
            stack.push({ type: beginMatch[1] as 'itemize' | 'enumerate', count: 1 });
            // Do NOT push the marker. It has zero indentation and breaks Markdown list hierarchies.
            continue;
        }

        const endMatch = trimmed.match(/^\\end\{(itemize|enumerate)\}/);
        if (endMatch) {
            stack.pop();
            // Do NOT push the marker.
            continue;
        }

        const itemMatch = trimmed.match(/^\\item(?:\[(.*?)\]|\{(.*?)\})?\s*(.*)/);
        if (itemMatch) {
            if (stack.length === 0) {
                result.push(line);
                continue;
            }
            const current = stack[stack.length - 1];
            const indent = '    '.repeat(stack.length - 1);
            let prefix = current.type === 'enumerate' ? `${current.count}. ` : '- ';
            if (current.type === 'enumerate') current.count++;

            const label = itemMatch[1] || itemMatch[2];
            const remaining = itemMatch[3];

            if (label) {
                result.push(`${indent}${prefix}${marker}**${label.trim()}** ${remaining}`);
            } else {
                result.push(`${indent}${prefix}${marker}${remaining}`);
            }
            continue;
        }

        if (stack.length > 0) {
            if (trimmed === '') {
                // If the line is empty but has a marker (e.g., from the regex split), preserve the marker
                if (marker) result.push(`${'    '.repeat(stack.length)}${marker}`);
                else result.push('');
                continue;
            }
            const indent = '    '.repeat(stack.length);

            // Just indent the line and the marker normally.
            // Math tags ($$) will have their internal markers handled by the previous regex steps.
            // CRITICAL FIX: Prepend a newline to force remark-parse to treat continuation lines as SEPARATE paragraphs
            // otherwise all markers in a list item collapse into a single tag and overwrite each other.
            result.push(`\n${indent}${marker}${trimmed}`);
            continue;
        }

        result.push(line);
    }

    return result.join('\n');
}
