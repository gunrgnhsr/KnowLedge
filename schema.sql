-- schema.sql
-- Run this in your Supabase SQL Editor to create the necessary tables.

-- 1. Topics Table
CREATE TABLE topics (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL
);

-- 2. Concepts Table
CREATE TABLE concepts (
    id UUID PRIMARY KEY,
    type TEXT NOT NULL DEFAULT 'concept',
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    "topicIds" UUID[] DEFAULT '{}',
    
    -- Spaced Repetition Fields
    "createdAt" BIGINT NOT NULL,
    "updatedAt" BIGINT NOT NULL,
    "nextReviewDate" BIGINT NOT NULL,
    "interval" INTEGER NOT NULL,
    "easeFactor" REAL NOT NULL,
    "repetitions" INTEGER NOT NULL,
    "lastGrade" INTEGER
);

-- 3. Problems Table
CREATE TABLE problems (
    id UUID PRIMARY KEY,
    type TEXT NOT NULL DEFAULT 'problem',
    question TEXT NOT NULL,
    solution TEXT NOT NULL,
    "topicIds" UUID[] DEFAULT '{}',
    hints UUID[] DEFAULT '{}',
    
    -- Spaced Repetition Fields
    "createdAt" BIGINT NOT NULL,
    "updatedAt" BIGINT NOT NULL,
    "nextReviewDate" BIGINT NOT NULL,
    "interval" INTEGER NOT NULL,
    "easeFactor" REAL NOT NULL,
    "repetitions" INTEGER NOT NULL,
    "lastGrade" INTEGER
);

-- Note: We are using JSON-like camelCase column names wrapped in quotes 
-- to accurately match the TypeScript models you already use and avoid mapping logic.
