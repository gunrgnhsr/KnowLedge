import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import { visit } from 'unist-util-visit';

const userSnippet3Level = `\\begin{itemize}
\\item Level 1
    \\begin{itemize}
    \\item Level 2
        \\begin{itemize}
        \\item Level 3
        \\end{itemize}
    \\end{itemize}
\\end{itemize}`;

const annotated3 = annotateSource(userSnippet3Level);
const preprocessed3 = preprocessLaTeX(annotated3);
console.log("\n--- PREPROCESSED 3-LEVEL ---");
console.log(preprocessed3);

