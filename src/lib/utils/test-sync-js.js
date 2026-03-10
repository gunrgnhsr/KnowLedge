
const MARKER_PREFIX = '\u200B§SL:';
const MARKER_SUFFIX = '§\u200B';

function annotateSource(content) {
    if (!content) return content;
    return content.split('\n').map((line, i) => {
        if (!line.trim()) return line;
        return `${line}${MARKER_PREFIX}${i + 1}${MARKER_SUFFIX}`;
    }).join('\n');
}

function preprocessLaTeX(content) {
    if (!content) return content;
    let processed = content;

    const tikzEnvRegex = /\\{1,2}begin\{tikzpicture\}([\s\S]*?)\\{1,2}end\{tikzpicture\}(\\u200B§SL:\d+§\\u200B)?/g;
    processed = processed.replace(tikzEnvRegex, (match, body, marker) => {
        const prefix = marker || '';
        return `\n\n${prefix}\`\`\`tikz\n\\begin{tikzpicture}${body}\\end{tikzpicture}\n\`\`\`\n\n`;
    });

    processed = processed.replace(/(\u200B§SL:\d+§\u200B)?\$\$\s*([\s\S]*?)\s*\$\$(\u200B§SL:\d+§\u200B)?/g, '\n\n$1$$\n$2\n$$\n$3\n\n');

    processed = processed.replace(/\\begin\{align\*?\}([\s\S]*?)\\end\{align\*?\}(\\u200B§SL:\d+§\\u200B)?/g, (match, inner, marker) => {
        const prefix = marker || '';
        return `\n\n${prefix}$$\n\\begin{aligned}${inner}\\end{aligned}\n$$\n\n`;
    });
    processed = processed.replace(/\\begin\{equation\*?\}([\s\S]*?)\\end\{equation\*?\}(\\u200B§SL:\d+§\\u200B)?/g, (match, inner, marker) => {
        const prefix = marker || '';
        return `\n\n${prefix}$$\n${inner.trim()}\n$$\n\n`;
    });

    processed = processed.replace(/\\subsection\*?\{([^}]+)\}(\\u200B§SL:\d+§\\u200B)?/g, '\n$2### $1\n');
    processed = processed.replace(/\\subsubsection\*?\{([^}]+)\}(\\u200B§SL:\d+§\\u200B)?/g, '\n$2#### $1\n');

    processed = processStructuralLists(processed);
    processed = processed.replace(/\n{3,}/g, '\n\n');
    return processed;
}

function processStructuralLists(content) {
    const lines = content.split('\n');
    const stack = [];
    const result = [];
    for (let line of lines) {
        const markerMatch = line.match(/(\u200B§SL:\d+§\u200B)$/);
        const marker = markerMatch ? markerMatch[1] : '';
        const lineContent = marker ? line.substring(0, line.length - marker.length) : line;
        const trimmed = lineContent.trim();

        const beginMatch = trimmed.match(/^\\begin\{(itemize|enumerate)\}(?:\[.*?\])?/);
        if (beginMatch) {
            stack.push({ type: beginMatch[1], count: 1 });
            result.push('');
            continue;
        }

        const endMatch = trimmed.match(/^\\end\{(itemize|enumerate)\}/);
        if (endMatch) {
            stack.pop();
            result.push('');
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
                result.push('');
                continue;
            }
            const indent = '    '.repeat(stack.length);
            result.push(`${indent}${marker}${trimmed}`);
            continue;
        }
        result.push(line);
    }
    return result.join('\n');
}

const testContent = `\\begin{itemize}
\\item Level 1
\\begin{itemize}
\\item Level 2
\\end{itemize}
\\end{itemize}`;

console.log("--- RESULTS ---");
const processed = preprocessLaTeX(annotateSource(testContent));
console.log(processed.replace(/\u200B/g, '[ZWS]'));
