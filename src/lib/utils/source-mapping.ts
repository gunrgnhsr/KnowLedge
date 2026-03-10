import { visit } from 'unist-util-visit';
import { Plugin } from 'unified';

const MARKER_PREFIX = '\u200B§SL:';
const MARKER_SUFFIX = '§\u200B';

// Extremely robust regex that handles ZWS, missing ZWS, and potential internal whitespace/formatting
export const MARKER_REGEX = /\u200B?\s*§SL\s*:\s*(\d+)\s*§\u200B?/;
export const MARKER_REGEX_GLOBAL = /\u200B?\s*§SL\s*:\s*(\d+)\s*§\u200B?/g;

/**
 * Annotates every non-empty line of the source with an invisible marker containing its line number.
 * Markers are placed at the END to avoid interfering with Markdown indentation/syntax detection.
 */
export function annotateSource(content: string): string {
    if (!content) return content;
    return content.split('\n').map((line, i) => {
        if (!line.trim()) return line;
        return `${line}${MARKER_PREFIX}${i + 1}${MARKER_SUFFIX}`;
    }).join('\n');
}

/**
 * Strips all source mapping markers from a string.
 */
export function stripMarkers(content: string): string {
    if (!content) return content;
    return content.replace(MARKER_REGEX_GLOBAL, '');
}

/**
 * Remark plugin that extracts line markers from nodes and 
 * attaches them as data-line attributes to the parent or current HTML element.
 */
export const remarkSourceMap: Plugin = () => {
    // Helper to recursively strip markers from deep HTML representations (hast skeletons)
    const stripHChildren = (children: any[]) => {
        if (!children || !Array.isArray(children)) return;
        for (const child of children) {
            if (child.type === 'text' && typeof child.value === 'string') {
                child.value = child.value.replace(MARKER_REGEX_GLOBAL, '');
            }
            if (child.children) {
                stripHChildren(child.children);
            }
        }
    };

    return (tree) => {
        // Universal stripping from shadow properties (hChildren) to prevent leaks in KaTeX/Math plugins
        visit(tree, (node: any) => {
            if (node.data?.hChildren) {
                stripHChildren(node.data.hChildren);
            }
        });

        // Extract markers and attach data-line properties
        visit(tree, (node: any, index, parent: any) => {
            const props = ['value', 'alt', 'title', 'url'];
            let foundMarkerValue: string | null = null;

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
                let target = blockTypes.includes(node.type) ? node : parent;

                if (target && target.type !== 'root') {
                    target.data = target.data || {};
                    target.data.hProperties = target.data.hProperties || {};
                    if (!target.data.hProperties['data-line']) {
                        target.data.hProperties['data-line'] = foundMarkerValue;
                    }
                }
            }
        });

        // PROPAGATION: Ensure data-line survives rehyping in tight lists
        // If a listItem's primary paragraph has a data-line, copy it to the listItem itself.
        visit(tree, 'listItem', (node: any) => {
            if (!node.data?.hProperties?.['data-line'] && node.children?.length > 0) {
                const firstChild = node.children[0];
                if (firstChild.type === 'paragraph' && firstChild.data?.hProperties?.['data-line']) {
                    node.data = node.data || {};
                    node.data.hProperties = node.data.hProperties || {};
                    node.data.hProperties['data-line'] = firstChild.data.hProperties['data-line'];
                }
            }
        });
    };
};

/**
 * Custom Rehype plugin to preserve data-line attributes across KaTeX transformations.
 * KaTeX replaces the original math nodes entirely, destroying our attached data-line properties.
 * This plugin runs BEFORE rehype-katex, wrapping the math node in a preserving <span>
 * that holds the data-line attribute safely out of KaTeX's destructive path.
 */
export const rehypePreserveSync: Plugin = () => {
    return (tree) => {
        visit(tree, 'element', (node: any, index: number, parent: any) => {
            // Find nodes created by remark-math (they usually have the 'math' class or are math elements)
            if (node.properties && node.properties.className && Array.isArray(node.properties.className) && node.properties.className.includes('math')) {
                // Check if our remarkSourceMap successfully attached the data-line
                if (node.properties['data-line']) {
                    const dataLine = node.properties['data-line'];

                    // Remove data-line from the math node so it doesn't get messed up
                    delete node.properties['data-line'];

                    // Create a protective wrapper element holding the data-line
                    const isBlock = node.properties.className.includes('math-display');
                    const tagName = isBlock ? 'div' : 'span';
                    const wrapper = {
                        type: 'element',
                        tagName: tagName,
                        properties: {
                            className: isBlock ? ['math-sync-wrapper', 'block', 'w-full'] : ['math-sync-wrapper'],
                            'data-line': dataLine
                        },
                        // Put the original math node inside the wrapper
                        children: [node]
                    };

                    // Replace the math node with the wrapper in the AST tree
                    if (parent && parent.children && typeof index === 'number') {
                        parent.children[index] = wrapper;
                    }
                }
            }
        });
    };
};
