"use server";

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

const PROBLEM_SCHEMA = {
  description: "A generated study problem",
  type: SchemaType.OBJECT,
  properties: {
    question: { type: SchemaType.STRING },
    solution: { type: SchemaType.STRING },
    newConcepts: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          content: { type: SchemaType.STRING },
        },
        required: ["title", "content"],
      },
    },
    existingConceptIds: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING }
    }
  },
  required: ["question", "solution"],
};

const DISCOVERY_SCHEMA = {
  description: "Discovered concepts",
  type: SchemaType.OBJECT,
  properties: {
    concepts: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          content: { type: SchemaType.STRING },
        },
        required: ["title", "content"],
      }
    }
  },
  required: ["concepts"],
};

const FEEDBACK_SCHEMA = {
  description: "Feedback on a student's solution",
  type: SchemaType.OBJECT,
  properties: {
    isCorrect: { 
      type: SchemaType.STRING,
      enum: ["Correct", "Incorrect", "Partial"]
    },
    feedback: { type: SchemaType.STRING },
    correction: { type: SchemaType.STRING },
  },
  required: ["isCorrect", "feedback", "correction"],
};

export async function generateProblemFromContent(
  prompt: string,
  media?: { mimeType: string; data: string }
) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set.");
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-3.1-flash-lite-preview",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: PROBLEM_SCHEMA as any,
    },
  });

  try {
    const parts: any[] = [prompt];
    if (media) {
      parts.push({
        inlineData: {
          mimeType: media.mimeType,
          data: media.data
        }
      });
    }

    const result = await model.generateContent(parts);
    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw new Error("Failed to generate problem.");
  }
}

export async function discoverConceptsFromContent(
  prompt: string,
  media?: { mimeType: string; data: string }
) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set.");
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-3.1-flash-lite-preview",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: DISCOVERY_SCHEMA as any,
    },
  });

  try {
    const parts: any[] = [prompt];
    if (media) {
      parts.push({
        inlineData: {
          mimeType: media.mimeType,
          data: media.data
        }
      });
    }

    const result = await model.generateContent(parts);
    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error("AI Discovery Error:", error);
    throw new Error("Failed to discover concepts.");
  }
}

export async function checkSolutionWithAI(
  problemContext: { question: string; expectedSolution: string },
  studentSolution: string,
  media?: { mimeType: string; data: string }
) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set.");
  }

  const model = genAI.getGenerativeModel({
    model: "gemini-3.1-flash-lite-preview",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: FEEDBACK_SCHEMA as any,
    },
  });

  const prompt = `
    You are an expert tutor. Analyze the student's solution to the following problem.
    
    Problem:
    ${problemContext.question}
    
    Expected Solution/Reference:
    ${problemContext.expectedSolution}
    
    Student's Provided Text Solution:
    ${studentSolution || "No text provided (check attached media if any)."}
    
    Review any attached images or files closely.
    Provide constructive feedback. If the answer is wrong, explain WHY and guide them to the correct logic without just giving the answer if possible, but then provide the full correction in the 'correction' field.
  `;

  try {
    const parts: any[] = [prompt];
    if (media) {
      parts.push({
        inlineData: {
          mimeType: media.mimeType,
          data: media.data
        }
      });
    }

    const result = await model.generateContent(parts);
    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error("AI Verification Error:", error);
    throw new Error("Failed to verify solution with AI.");
  }
}
