import { Concept, Problem, Topic } from "../db/models";

export const BASE_INSTRUCTIONS = `
Act as a university professor and subject matter expert. 
Your task is to generate a high-quality practice problem based on the context provided.
Follow these rules strictly:
1. LaTeX MATH: Use LaTeX for ALL math. 
   - Every single "\\" in LaTeX MUST be written as "\\\\" (double backslash) in the JSON strings for valid escaping.
   - Example: "$\\\\frac{1}{2}$" (represents $\frac{1}{2}$).
2. NEW LINES: Use "\\n" (backslash and n) for all line breaks within JSON string values. 
   - Do NOT use actual literal multi-line line breaks in the JSON output, as this makes it invalid JSON.
3. CONCEPT HINTS:
   - Use provided "Existing Concepts" (Title and Content/Formula) as much as possible.
   - Link them by ID in "existingConceptIds" if they are critical to the solution.
   - If you need a concept that is NOT in the list, provide its "title" and "content" in "newConcepts".
4. DIAGRAMS: Use TikZ for diagrams. Surround with standard \\\\begin{tikzpicture} and \\\\end{tikzpicture} tags.
5. Output ONLY a single valid JSON object.

Expected JSON format:
{
  "question": "Problem text...",
  "solution": "Step-by-step solution...",
  "existingConceptIds": ["id1", "id2"],
  "newConcepts": [
    { "title": "Name", "content": "Explanation..." }
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
- NEW LINES: Use "\\n" for all line breaks within your JSON string values. NEVER use literal multi-line strings.
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

Review any attached media (screenshots, diagrams, textbook pages) closely to extract educational content and define new concepts accurately.
`;
  },

  generateFromRawContent: (content: string, existingConcepts: Concept[] = []) => {
    const list = existingConcepts.map(c => `- ${c.title}: ${c.content} (ID: ${c.id})`).join("\n");
    return `
${BASE_INSTRUCTIONS}

TASK: Based on the content below (and any attached images/files), generate a high-quality study problem.

AVAILABLE CONCEPTS (for hints):
${list || "(No existing concepts provided)"}

CONTENT:
${content || "No text provided (analyze the attached media)."}

Review any attached media closely to extract context, math formulas, or diagrams for the problem. 
If an existing concept fits as a hint, include its ID in "existingConceptIds".
`;
  }
};
