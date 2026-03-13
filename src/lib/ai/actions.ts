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

export async function generateProblemFromContent(prompt: string) {
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
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw new Error("Failed to generate problem.");
  }
}

export async function discoverConceptsFromContent(prompt: string) {
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
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error("AI Discovery Error:", error);
    throw new Error("Failed to discover concepts.");
  }
}
