import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeKatex from 'rehype-katex';
import { visit } from 'unist-util-visit';

const MARKER_REGEX = /\u200B?\s*§SL\s*:\s*(\d+)\s*§\u200B?/;
const MARKER_REGEX_GLOBAL = /\u200B?\s*§SL\s*:\s*(\d+)\s*§\u200B?/g;

function mimicPreprocess(content) {
    let processed = content;
    processed = processed.replace(/^\s*(\u200B?\s*§SL\s*:\s*\d+\s*§\u200B?)?\$\$\s*([\s\S]*?)\s*\$\$(\u200B?\s*§SL\s*:\s*\d+\s*§\u200B?)?/gm, (match, m1, body, m2) => {
        const marker = m1 || m2 || '';
        const cleanBody = body.replace(MARKER_REGEX_GLOBAL, '');
        return `\n\n$$\n${marker}\n${cleanBody.trim()}\n$$\n\n`;
    });
    return processed;
}

const remarkSourceMapTest = () => (tree) => {
    visit(tree, (node, index, parent) => {
        const props = ['value', 'alt', 'title', 'url'];
        let foundMarkerValue = null;
        for (const prop of props) {
            if (typeof node[prop] === 'string' && node[prop]) {
                if (MARKER_REGEX.test(node[prop])) {
                    const match = node[prop].match(MARKER_REGEX);
                    if (match) foundMarkerValue = match[1];
                    node[prop] = node[prop].replace(MARKER_REGEX_GLOBAL, '');
                }
            }
        }
        if (foundMarkerValue) {
            const blockTypes = ['math', 'code', 'html', 'table', 'blockquote', 'heading', 'listItem', 'paragraph'];
            const target = blockTypes.includes(node.type) ? node : parent;
            if (target && target.type !== 'root') {
                target.data = target.data || {};
                target.data.hProperties = target.data.hProperties || {};
                target.data.hProperties['data-line'] = foundMarkerValue;
                console.log(`[AST] Attached data-line=${foundMarkerValue} to ${target.type}`);
            }
        }
    });
};

const userSnippet = `- Level 1 list item \u200B§SL:1§\u200B
  - Level 2 \u200B§SL:2§\u200B
    - **Clausius-Clapeyron Equation**: \u200B§SL:3§\u200B

      \u200B§SL:5§\u200B
      $$
      \\ln\\left(\\frac{P_2}{P_1}\\right) = -\\frac{\\Delta H_{vap}}{R}\\left(\\frac{1}{T_2} - \\frac{1}{T_1}\\right)
      $$
      \u200B§SL:9§\u200B

    - **Relative Humidity (RH)**: $RH = \\frac{P_{H_2O}}{P_{H_2O}^\\circ} \\times 100\\%$ \u200B§SL:11§\u200B`;

const preprocessed = mimicPreprocess(userSnippet);

const processor = unified()
    .use(remarkParse)
    .use(remarkMath)
    .use(remarkSourceMapTest)
    .use(remarkRehype)
    .use(rehypeKatex);

const hast = processor.runSync(processor.parse(preprocessed));

console.log("\n--- HAST DUMP ---");
function dumpNode(node, depth = 0) {
    const indent = '  '.repeat(depth);
    let info = `${node.type} | tagName: ${node.tagName || 'N/A'}`;
    if (node.properties && node.properties['data-line']) {
        info += ` [data-line="${node.properties['data-line']}"]`;
    }
    if (node.properties && node.properties.className) {
        info += ` class="${node.properties.className.join(' ')}"`;
    }
    console.log(`${indent}${info}`);
    if (node.children) {
        node.children.forEach(child => dumpNode(child, depth + 1));
    }
}
dumpNode(hast);
