const fs = require('fs');
const content = fs.readFileSync('math_form1', 'utf8');

// Find all \section{...} and capture the content until the next \section or EOF
const sectionRegex = /\\section\{([^}]+)\}([\s\S]*?)(?=\\section\{|$)/g;

let concepts = [];
let match;

function preprocessToMarkdown(text) {
    let processed = text;

    // 1. Remove structure elements
    processed = processed.replace(/\\begin\{multicols\*?\}\{.*?\}/g, '');
    processed = processed.replace(/\\end\{multicols\*?\}/g, '');
    processed = processed.replace(/\\newpage/g, '');
    processed = processed.replace(/\\noindent/g, '');

    // 2. Headings and bold/italic
    processed = processed.replace(/\\textbf\{([^}]+)\}/g, '**$1**');
    processed = processed.replace(/\\textit\{([^}]+)\}/g, '*$1*');
    processed = processed.replace(/\\subsection\*?\{([^}]+)\}/g, '\n### $1\n');
    processed = processed.replace(/\\subsubsection\*?\{([^}]+)\}/g, '\n#### $1\n');

    // 3. Spaced block math: code wrapped between two $$ suppose to be centered and be followed by new line
    processed = processed.replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, '\n\n$$\n$1\n$$\n\n');

    // 4. Nested lists: 1 tab per indentation, and item line should end with new line
    const stack = [];
    processed = processed.replace(/\s*(?:\\begin\{(itemize|enumerate)\}(?:\[.*?\])?|\\end\{(itemize|enumerate)\}|\\item(?:\[(.*?)\]|\{(.*?)\})?)/g, (match, beginType, endType, bracketLabel, braceLabel) => {
        if (beginType) {
            stack.push({ type: beginType, count: 1 });
            return '\n';
        } else if (endType) {
            stack.pop();
            return '\n';
        } else if (match.includes('\\item')) {
            if (stack.length === 0) return match;

            const currentList = stack[stack.length - 1];
            // 1 tab indentation
            const indent = '\t'.repeat(stack.length - 1);
            let prefix = '';

            if (currentList.type === 'enumerate') {
                prefix = `${currentList.count}. `;
                currentList.count++;
            } else {
                prefix = '- ';
            }

            const label = bracketLabel || braceLabel;
            if (label) {
                // Return item with newlines to ensure "item line should end with new line"
                return `\n${indent}${prefix}**${label.trim()}** `;
            }
            return `\n${indent}${prefix}`;
        }
        return match;
    });

    // Clean up excessive newlines
    processed = processed.replace(/\n{3,}/g, '\n\n');

    return processed.trim();
}

while ((match = sectionRegex.exec(content)) !== null) {
    let title = match[1].trim();
    let text = match[2].trim();

    concepts.push({
        title: title,
        content: preprocessToMarkdown(text)
    });
}

let output = JSON.stringify({ concepts: concepts }, null, 2);

// Single backslashes for custom parser & true newlines
output = output.replace(/\\\\/g, '\\');
output = output.replace(/\\r\\n/g, '\\n');

fs.writeFileSync('math_form1_concepts.json', output);
console.log('Successfully generated math_form1_concepts.json with ' + concepts.length + ' concepts.');
