const fs = require('fs');
const content = fs.readFileSync('physics_form1', 'utf8');

// Find all \section{...} and capture the content until the next \section or EOF
const sectionRegex = /\\section\{([^}]+)\}([\s\S]*?)(?=\\section\{|$)/g;

let concepts = [];
let match;
while ((match = sectionRegex.exec(content)) !== null) {
    let title = match[1].trim();
    let text = match[2].trim();

    // We want to preserve most formatting, but strip structural commands that
    // don't make sense in markdown/frontend like multicols
    text = text.replace(/\\begin\{multicols\*?\}\{.*?\}/g, '');
    text = text.replace(/\\end\{multicols\*?\}/g, '');
    text = text.replace(/\\newpage/g, '');
    text = text.replace(/\\noindent/g, '');

    // Replace \textbf, \textit, \subsection with markdown equivalents to ensure
    // they render perfectly even without KaTeX support outside math blocks
    text = text.replace(/\\textbf\{([^}]+)\}/g, '**$1**');
    text = text.replace(/\\textit\{([^}]+)\}/g, '*$1*');
    text = text.replace(/\\subsection\{([^}]+)\}/g, '### $1');
    text = text.replace(/\\subsubsection\{([^}]+)\}/g, '#### $1');

    // Convert math blocks like $$ ... $$ to make sure they're padded with newlines
    // so the Markdown renderer sees them as block equations correctly
    // (Optional, our renderer handles it if on new lines)

    concepts.push({
        title: title,
        content: text.trim()
    });
}

let output = JSON.stringify({ concepts: concepts }, null, 2);

// The application's custom parser requires single backslashes for LaTeX macros
// rather than standard JSON double backslashes, and prefers \n over \r\n
output = output.replace(/\\\\/g, '\\');
output = output.replace(/\\r\\n/g, '\\n');

fs.writeFileSync('physics_form1_concepts.json', output);
console.log('Successfully generated physics_form1_concepts.json with ' + concepts.length + ' concepts.');
