import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import { visit } from 'unist-util-visit';

const MARKER_REGEX = /\u200B?\s*§SL\s*:\s*(\d+)\s*§\u200B?/;
const MARKER_REGEX_GLOBAL = /\u200B?\s*§SL\s*:\s*(\d+)\s*§\u200B?/g;

const remarkSourceMap = () => {
    return (tree) => {
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
                const blockTypes = ['math', 'code', 'html', 'table', 'blockquote', 'heading', 'listItem'];
                const target = blockTypes.includes(node.type) ? node : parent;

                if (target && target.type !== 'root') {
                    target.data = target.data || {};
                    target.data.hProperties = target.data.hProperties || {};
                    if (!target.data.hProperties['data-line']) {
                        target.data.hProperties['data-line'] = foundMarkerValue;
                    }
                }

                // Debug log
                console.log(`Attached data-line=${foundMarkerValue} to node type=${target.type}`);
            }
        });
    };
};

const input = `
- Level 1 \u200B§SL:1§\u200B
  - Level 2 \u200B§SL:2§\u200B
    - Level 3 \u200B§SL:3§\u200B
`;

console.log("Processing Markdown:");
console.log(input.replace(/\u200B/g, ''));

const processor = unified()
    .use(remarkParse)
    .use(remarkMath)
    .use(remarkSourceMap);

const ast = processor.parse(input);
processor.runSync(ast);
console.log("\nDone!");
