import { Concept, Problem, StudyItem, Topic, ReviewGrade } from "./models";
import { addDays } from "date-fns";
import { supabase } from "./supabase";

export const api = {
    // Topics API
    topics: {
        list: async (): Promise<Topic[]> => {
            const { data, error } = await supabase.from('topics').select('*');
            if (error) throw new Error(error.message);
            return data as Topic[];
        },
        create: async (topic: Omit<Topic, "id">): Promise<Topic> => {
            // Check existence
            const { data: existing } = await supabase.from('topics').select('id').ilike('name', topic.name);
            if (existing && existing.length > 0) {
                throw new Error(`A topic with the name "${topic.name}" already exists.`);
            }

            const newTopic = { ...topic, id: crypto.randomUUID() };
            const { error } = await supabase.from('topics').insert([newTopic]);
            if (error) throw new Error(error.message);
            return newTopic;
        },
        update: async (id: string, updates: Partial<Topic>): Promise<Topic | null> => {
            if (updates.name) {
                const { data: existing } = await supabase.from('topics').select('id').ilike('name', updates.name).neq('id', id);
                if (existing && existing.length > 0) {
                    throw new Error(`A topic with the name "${updates.name}" already exists.`);
                }
            }
            const { data, error } = await supabase.from('topics').update(updates).eq('id', id).select().single();
            if (error) throw new Error(error.message);
            return data as Topic;
        },
        delete: async (id: string): Promise<void> => {
            const { error } = await supabase.from('topics').delete().eq('id', id);
            if (error) throw new Error(error.message);
        }
    },

    // Concepts API
    concepts: {
        listSummaries: async (params?: { topicId?: string, limit?: number, offset?: number }): Promise<Concept[]> => {
            let query = supabase.from('concepts')
                .select('id, topicIds, createdAt, updatedAt, nextReviewDate, interval, easeFactor, repetitions, lastGrade, type, title')
                .order('createdAt', { ascending: false });

            if (params?.topicId) {
                query = query.contains('topicIds', [params.topicId]);
            }
            if (params?.limit) {
                const from = params.offset || 0;
                query = query.range(from, from + params.limit - 1);
            }

            const { data, error } = await query;
            if (error) throw new Error(error.message);
            return data as Concept[];
        },
        getById: async (id: string): Promise<Concept | null> => {
            const { data, error } = await supabase.from('concepts').select('*').eq('id', id).maybeSingle();
            if (error) throw new Error(error.message);
            return data as Concept;
        }
    },

    // Problems API
    problems: {
        listSummaries: async (params?: { topicId?: string, conceptId?: string, limit?: number, offset?: number }): Promise<Problem[]> => {
            let query = supabase.from('problems')
                .select('id, topicIds, createdAt, updatedAt, nextReviewDate, interval, easeFactor, repetitions, lastGrade, type, question, hints')
                .order('createdAt', { ascending: false });

            if (params?.topicId) {
                query = query.contains('topicIds', [params.topicId]);
            }
            if (params?.conceptId) {
                query = query.contains('hints', [params.conceptId]);
            }
            if (params?.limit) {
                const from = params.offset || 0;
                query = query.range(from, from + params.limit - 1);
            }

            const { data, error } = await query;
            if (error) throw new Error(error.message);
            return data as Problem[];
        },
        getById: async (id: string): Promise<Problem | null> => {
            const { data, error } = await supabase.from('problems').select('*').eq('id', id).maybeSingle();
            if (error) throw new Error(error.message);
            return data as Problem;
        }
    },

    // Study Items API
    items: {
        list: async (): Promise<StudyItem[]> => {
            const [conceptsRes, problemsRes] = await Promise.all([
                supabase.from('concepts').select('*'),
                supabase.from('problems').select('*')
            ]);

            if (conceptsRes.error) throw new Error(conceptsRes.error.message);
            if (problemsRes.error) throw new Error(problemsRes.error.message);

            const concepts = (conceptsRes.data || []) as Concept[];
            const problems = (problemsRes.data || []) as Problem[];

            return [...concepts, ...problems].sort((a, b) => b.createdAt - a.createdAt);
        },
        getDueItems: async (): Promise<StudyItem[]> => {
            const now = Date.now();
            const [conceptsRes, problemsRes] = await Promise.all([
                supabase.from('concepts').select('*').lte('nextReviewDate', now),
                supabase.from('problems').select('*').lte('nextReviewDate', now)
            ]);

            if (conceptsRes.error) throw new Error(conceptsRes.error.message);
            if (problemsRes.error) throw new Error(problemsRes.error.message);

            const concepts = (conceptsRes.data || []) as Concept[];
            const problems = (problemsRes.data || []) as Problem[];

            return [...concepts, ...problems];
        },
        createConcept: async (concept: Pick<Concept, "title" | "content" | "topicIds">): Promise<Concept> => {
            const now = Date.now();
            const newConcept: Concept = {
                ...concept,
                id: crypto.randomUUID(),
                type: "concept",
                createdAt: now,
                updatedAt: now,
                nextReviewDate: now,
                interval: 0,
                easeFactor: 2.5,
                repetitions: 0
            };

            const { error } = await supabase.from('concepts').insert([newConcept]);
            if (error) throw new Error(error.message);
            return newConcept;
        },
        createProblem: async (problem: Pick<Problem, "question" | "solution" | "topicIds" | "hints">): Promise<Problem> => {
            const now = Date.now();
            const newProblem: Problem = {
                ...problem,
                hints: problem.hints || [],
                id: crypto.randomUUID(),
                type: "problem",
                createdAt: now,
                updatedAt: now,
                nextReviewDate: now,
                interval: 0,
                easeFactor: 2.5,
                repetitions: 0
            };

            const { error } = await supabase.from('problems').insert([newProblem]);
            if (error) throw new Error(error.message);
            return newProblem;
        },
        createMany: async (newItems: (Pick<Concept, "title" | "content" | "topicIds"> | Pick<Problem, "question" | "solution" | "topicIds" | "hints">)[]): Promise<StudyItem[]> => {
            const now = Date.now();

            const concepts: Concept[] = [];
            const problems: Problem[] = [];

            for (const item of newItems) {
                const isProblem = 'question' in item;
                if (isProblem) {
                    problems.push({
                        ...item as Problem,
                        hints: (item as Problem).hints || [],
                        id: crypto.randomUUID(),
                        type: "problem",
                        createdAt: now,
                        updatedAt: now,
                        nextReviewDate: now,
                        interval: 0,
                        easeFactor: 2.5,
                        repetitions: 0
                    } as Problem);
                } else {
                    concepts.push({
                        ...item as Concept,
                        id: crypto.randomUUID(),
                        type: "concept",
                        createdAt: now,
                        updatedAt: now,
                        nextReviewDate: now,
                        interval: 0,
                        easeFactor: 2.5,
                        repetitions: 0
                    } as Concept);
                }
            }

            if (concepts.length > 0) {
                const { error } = await supabase.from('concepts').insert(concepts);
                if (error) throw new Error(error.message);
            }
            if (problems.length > 0) {
                const { error } = await supabase.from('problems').insert(problems);
                if (error) throw new Error(error.message);
            }

            return [...concepts, ...problems];
        },
        delete: async (id: string): Promise<void> => {
            // We don't know the type, so we try deleting from both
            await Promise.all([
                supabase.from('concepts').delete().eq('id', id),
                supabase.from('problems').delete().eq('id', id)
            ]);
        },
        getById: async (id: string): Promise<StudyItem | null> => {
            const [conceptRes, problemRes] = await Promise.all([
                supabase.from('concepts').select('*').eq('id', id).maybeSingle(),
                supabase.from('problems').select('*').eq('id', id).maybeSingle()
            ]);

            if (conceptRes.data) return conceptRes.data as Concept;
            if (problemRes.data) return problemRes.data as Problem;
            return null;
        },
        updateConcept: async (id: string, updates: Partial<Pick<Concept, "title" | "content" | "topicIds">>): Promise<Concept | null> => {
            const { data, error } = await supabase.from('concepts').update({
                ...updates,
                updatedAt: Date.now()
            }).eq('id', id).select().single();

            if (error) throw new Error(error.message);
            return data as Concept;
        },
        updateProblem: async (id: string, updates: Partial<Pick<Problem, "question" | "solution" | "topicIds" | "hints">>): Promise<Problem | null> => {
            const { data, error } = await supabase.from('problems').update({
                ...updates,
                updatedAt: Date.now()
            }).eq('id', id).select().single();

            if (error) throw new Error(error.message);
            return data as Problem;
        },

        // Core spaced repetition function
        reviewItem: async (id: string, grade: ReviewGrade): Promise<StudyItem | null> => {
            let itemType = 'concept';
            let itemRes = await supabase.from('concepts').select('*').eq('id', id).maybeSingle();

            if (itemRes.error || !itemRes.data) {
                itemRes = await supabase.from('problems').select('*').eq('id', id).maybeSingle();
                itemType = 'problem';
            }

            if (itemRes.error || !itemRes.data) return null;

            const item = itemRes.data as StudyItem;

            let newInterval = item.interval;
            let newRepetitions = item.repetitions;
            let newEaseFactor = item.easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));

            if (newEaseFactor < 1.3) newEaseFactor = 1.3;

            if (grade >= 3) {
                if (newRepetitions === 0) {
                    newInterval = 1;
                } else if (newRepetitions === 1) {
                    newInterval = 6;
                } else {
                    newInterval = Math.round(item.interval * newEaseFactor);
                }
                newRepetitions++;
            } else {
                newRepetitions = 0;
                newInterval = 1;
            }

            const nextReviewDate = addDays(new Date(), newInterval).getTime();

            const updates = {
                easeFactor: newEaseFactor,
                interval: newInterval,
                repetitions: newRepetitions,
                nextReviewDate,
                lastGrade: grade,
                updatedAt: Date.now()
            };

            const targetTable = itemType === 'concept' ? 'concepts' : 'problems';
            const { data: updatedItem, error } = await supabase.from(targetTable).update(updates).eq('id', id).select().single();

            if (error) throw new Error(error.message);

            return updatedItem as StudyItem;
        }
    }
};
