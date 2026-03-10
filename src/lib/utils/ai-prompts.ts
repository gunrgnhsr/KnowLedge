import { Concept, Problem, Topic } from "../db/models";

const BASE_INSTRUCTIONS = `
Act as a university professor and subject matter expert. 
Your task is to generate a high-quality practice problem based on the context provided.
Follow these rules strictly:
7. LaTeX MATH: Use LaTeX for ALL math. 
   - CRITICAL: JSON requires DOUBLE-ESCAPED backslashes. 
   - Every single "\\" in LaTeX MUST be written as "\\\\" in the JSON string.
   - Example: "$\\frac{1}{2}$" must be written as "$\\\\frac{1}{2}$".
   - Example: "\\begin{tikzpicture}" must be written as "\\\\begin{tikzpicture}".
8. NEW LINES: Use actual line breaks (Enter) inside the string values. Do NOT use literal \n character sequences.
9. CONCEPT HINTS ONLY:
   - You will be provided with a list of "Existing Concepts" (Title and Content/Formula).
   - Use ONLY these concepts (or suggested new ones) as hints.
   - If a concept is relevant, include its ID in "existingConceptIds".
   - If you need a concept that is NOT in the list, provide its "title" and "content" in "newConcepts".
10. DIAGRAMS: Use TikZ for diagrams. Surround with standard \\begin{tikzpicture} and \\end{tikzpicture} tags.
11. Output ONLY a single valid JSON object. No other text. Any conversational text will break the parser.

Expected JSON format:
{
  "question": "Problem text...",
  "solution": "Step-by-step solution...",
  "existingConceptIds": ["id1", "id2"],
  "newConcepts": [
     { "title": "Concise Name", "content": "Formula or short explanation..." }
  ]
}
`;

export const aiPrompts = {
  generateFromConcept: (concept: Concept, otherConcepts: Concept[] = []) => {
    const list = [concept, ...otherConcepts].map(c => `- ${c.title}: ${c.content} (ID: ${c.id})`).join("\n");
    return `
${BASE_INSTRUCTIONS}

CONTEXT:
Primary Concept: ${concept.title}
Content: ${concept.content}

ALL AVAILABLE CONCEPTS:
${list}

TASK: Generate a problem that tests the core understanding of "${concept.title}". Use the available concepts as the ONLY source of hints.
`;
  },

  generateFromTopic: (topic: Topic, concepts: Concept[]) => {
    const list = concepts.map(c => `- ${c.title}: ${c.content} (ID: ${c.id})`).join("\n");
    return `
${BASE_INSTRUCTIONS}

CONTEXT (Topic):
Name: ${topic.name}

AVAILABLE CONCEPTS IN THIS TOPIC:
${list}

TASK: Generate a challenging problem that integrates one or more of the concepts listed above. 
Use the concepts as the ONLY source of hints.
`;
  },

  generateVariation: (problem: Problem) => {
    return `
${BASE_INSTRUCTIONS}

CONTEXT (Existing Problem):
Original Question: ${problem.question}
Original Solution: ${problem.solution}

TASK: Generate a variation of this problem. Change the parameters or scenario while keeping the same complexity and topic.
`;
  },

  adaptExternal: (concepts: Concept[]) => {
    const list = concepts.map(c => `- ${c.title}: ${c.content} (ID: ${c.id})`).join("\n");
    return `
${BASE_INSTRUCTIONS}

TASK: I will provide you with a problem from an external source (textbook, website, etc.). 
Your goal is to REFORMAT it exactly into the JSON structure defined above.

Mapping Requirements:
1. Translate all math into LaTeX.
2. Link the problem to these available concepts if they are relevant:
${list}

INPUT TEXT (Reformat this):
[PASTE EXTERNAL PROBLEM CONTENT HERE]
`;
  },

  discoverConcepts: (topic: Topic, existingConcepts: Concept[]) => {
    const list = existingConcepts.map(c => `- ${c.title}: ${c.content}`).join("\n");
    return `
Act as a curriculum designer and expert in ${topic.name}. 
I am building a knowledge base for the topic: "${topic.name}".

CURRENTLY COVERED CONCEPTS (Full Content):
${list || "(No concepts added yet)"}

TASK:
1. Analyze the provided external source (pasted below or in attached files).
2. Identify ALL missing concepts or important sub-topics that are NOT yet covered in the list above.
3. For each missing concept, provide a concise title and a clear, high-quality explanation.

FORMATTING RULES:
- LaTeX MATH: Use LaTeX for ALL math. Use double-escaped backslashes for JSON (e.g., "$\\\\frac{1}{2}$").
- TikZ DIAGRAMS: If a concept benefit from a visual, include a TikZ block using standard \\\\begin{tikzpicture} and \\\\end{tikzpicture} tags.
- NO CITATIONS: Do NOT include page numbers, source names, or "From the text..." mentions. Just provide the raw educational content.
- RICH TEXT: Use **bold** for key terms. Use bullet points for lists.

OUTPUT FORMAT:
Return ONLY a valid JSON object:
{
  "concepts": [
    { "title": "Concept Name", "content": "Full content with LaTeX and TikZ..." },
    ...
  ]
}

SOURCE DATA:
[Analyze the attached files OR the pasted text below]
`;
  }
};
