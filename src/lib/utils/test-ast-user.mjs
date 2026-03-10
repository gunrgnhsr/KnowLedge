import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import { visit } from 'unist-util-visit';
import { preprocessLaTeX } from './latex-utils.ts';
import { annotateSource, remarkSourceMap } from './source-mapping.ts';

const userSnippet = `-  **Clausius-Clapeyron Equation**:

$$\\ln\\left(\\frac{P_2}{P_1}\\right) = -\\frac{\\Delta H_{vap}}{R}\\left(\\frac{1}{T_2} - \\frac{1}{T_1}\\right)$$

-  **Relative Humidity (RH)**: $RH = \\frac{P_{H_2O}}{P_{H_2O}^\\circ} \\times 100\\%$`;

const annotated = annotateSource(userSnippet);
const preprocessed = preprocessLaTeX(annotated);

console.log("--- PREPROCESSED OUTPUT ---");
console.log(preprocessed.replace(/\u200B/g, ''));

const processor = unified()
    .use(remarkParse)
    .use(remarkMath)
    .use(remarkSourceMap);

const ast = processor.parse(preprocessed);
processor.runSync(ast);

console.log("\n--- AST WITH DATA-LINE ATTRIBUTES ---");

function dumpNode(node, depth = 0) {
    const indent = '  '.repeat(depth);
    let info = `${node.type}`;
    if (node.data && node.data.hProperties && node.data.hProperties['data-line']) {
        info += ` [data-line="${node.data.hProperties['data-line']}"]`;
    }
    if (node.type === 'text' || node.type === 'inlineMath' || node.type === 'math') {
        info += ` value="${node.value.replace(/\n/g, '\\n')}"`;
    }
    console.log(`${indent}${info}`);
    if (node.children) {
        node.children.forEach(child => dumpNode(child, depth + 1));
    }
}

dumpNode(ast);
