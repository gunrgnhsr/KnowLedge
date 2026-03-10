import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MarkdownRenderer } from '../../components/ui/MarkdownRenderer';

const userSnippet = `-  **Clausius-Clapeyron Equation**: \u200B§SL:1§\u200B

\u200B§SL:3§\u200B
$$
\\ln\\left(\\frac{P_2}{P_1}\\right) = -\\frac{\\Delta H_{vap}}{R}\\left(\\frac{1}{T_2} - \\frac{1}{T_1}\\right)
$$
\u200B§SL:7§\u200B

-  **Relative Humidity (RH)**: $RH = \\frac{P_{H_2O}}{P_{H_2O}^\\circ} \\times 100\\%$ \u200B§SL:9§\u200B`;

try {
    const html = renderToStaticMarkup(<MarkdownRenderer content={userSnippet} />);
    console.log("--- GENERATED HTML ---");
    console.log(html);

    // Check if data-line is present
    const matches = html.match(/data-line="[^"]+"/g);
    if (matches) {
        console.log("\nFOUND DATA-LINE ATTRIBUTES:");
        matches.forEach(m => console.log(m));
    } else {
        console.log("\nNO DATA-LINE ATTRIBUTES FOUND IN FINAL HTML!");
    }
} catch (e) {
    console.error("Render failed:", e);
}
