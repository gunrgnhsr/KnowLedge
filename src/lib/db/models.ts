// src/lib/db/models.ts

export type ReviewGrade = 0 | 1 | 2 | 3 | 4 | 5;

export interface BaseItem {
    id: string;
    topicIds: string[];
    createdAt: number; // timestamp
    updatedAt: number; // timestamp

    // SuperMemo-2 Spaced Repetition fields
    nextReviewDate: number; // timestamp
    interval: number; // days
    easeFactor: number;
    repetitions: number;
    lastGrade?: ReviewGrade;
}

export interface Concept extends BaseItem {
    type: "concept";
    title: string;
    content: string; // HTML/Markdown string from editor
}

export interface Problem extends BaseItem {
    type: "problem";
    question: string; // HTML/Markdown string
    solution: string; // HTML/Markdown string
    hints: string[]; // List of concept IDs
}

export type StudyItem = Concept | Problem;

export interface Topic {
    id: string;
    name: string;
    color: string; // Hex color for a tag
}

