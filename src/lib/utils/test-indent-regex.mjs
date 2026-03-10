const MARKER_REGEX_STR = '(?:\\u200B?\\s*§SL\\s*:\\s*\\d+\\s*§\\u200B?)';
const MARKER_REGEX_GLOBAL = new RegExp(MARKER_REGEX_STR, 'g');

function strip(s) {
    return s.replace(MARKER_REGEX_GLOBAL, '');
}

function preprocessMath(content) {
    let processed = content;

    // Capture group details:
    // $1 = indent
    // $2 = marker before open
    // $3 = marker after open (crucial for annotateSource!)
    // $4 = body
    // $5 = marker after close
    const blockMathRegex = /^(\s*)(\u200B?\s*§SL\s*:\s*\d+\s*§\u200B?)?\$\$(\u200B?\s*§SL\s*:\s*\d+\s*§\u200B?)?\s*([\s\S]*?)\s*\$\$(\u200B?\s*§SL\s*:\s*\d+\s*§\u200B?)?/gm;

    processed = processed.replace(blockMathRegex, (match, indent, mBeforeOpen, mAfterOpen, body, mAfterClose) => {
        const marker = mBeforeOpen || mAfterOpen || mAfterClose || '';
        const cleanBody = strip(body);

        // Ensure newlines exist before the block if it's not the start of the string, but here we can just do \n block \n
        return `\n\n${indent}$$\n${indent}${marker.trim()}\n${indent}${cleanBody.trim()}\n${indent}$$\n\n`;
    });

    // Final cleanup of extra newlines
    processed = processed.replace(/\n{4,}/g, '\n\n\n');
    processed = processed.replace(/\n{3,}/g, '\n\n');

    return processed;
}

const input = `- Level 1
  - Level 2
    $$§SL:3§
    x = 1§SL:4§
    $$§SL:5§
  - Level 2 next`;

console.log("INPUT:");
console.log(input);

console.log("\nOUTPUT:");
console.log(preprocessMath(input));
