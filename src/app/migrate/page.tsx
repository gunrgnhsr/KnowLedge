"use client";

import { useState } from "react";
import { supabase } from "@/lib/db/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Database, CheckCircle, AlertTriangle, Trash2 } from "lucide-react";
import { Topic, Concept, Problem } from "@/lib/db/models";

export default function MigratePage() {
    const [status, setStatus] = useState<"idle" | "migrating" | "success" | "error">("idle");
    const [logs, setLogs] = useState<string[]>([]);

    const appendLog = (msg: string) => setLogs(prev => [...prev, msg]);

    const runMigration = async () => {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            setStatus("error");
            appendLog("ERROR: Supabase URL or Anon Key missing in .env.local");
            return;
        }

        setStatus("migrating");
        appendLog("Reading local storage...");

        try {
            // 1. Migrate Topics
            const topicsJson = localStorage.getItem("topics");
            if (topicsJson) {
                const topics: Topic[] = JSON.parse(topicsJson);
                appendLog(`Found ${topics.length} topics in local storage.`);

                if (topics.length > 0) {
                    const { error } = await supabase.from('topics').upsert(topics);
                    if (error) throw new Error(`Supabase Topics Error: ${error.message}`);
                    appendLog("Successfully migrated topics.");
                }
            } else {
                appendLog("No topics found in local storage.");
            }

            // 2. Migrate Study Items
            const itemsJson = localStorage.getItem("study_items");
            if (itemsJson) {
                const items = JSON.parse(itemsJson);
                appendLog(`Found ${items.length} total study items in local storage.`);

                const concepts = items.filter((i: any) => i.type === "concept") as Concept[];
                const problems = items.filter((i: any) => i.type === "problem") as Problem[];

                // Map concepts (ensure easeFactor is a float, arrays are strings)
                if (concepts.length > 0) {
                    appendLog(`Migrating ${concepts.length} concepts...`);
                    const safeConcepts = concepts.map(c => ({
                        ...c,
                        topicIds: (c.topicIds || []).map((t: any) => typeof t === 'string' ? t : t.id)
                    }));
                    const { error } = await supabase.from('concepts').upsert(safeConcepts);
                    if (error) throw new Error(`Supabase Concepts Error: ${error.message}`);
                    appendLog("Successfully migrated concepts.");
                }

                // Map problems (sanitize hints and topicIds arrays)
                if (problems.length > 0) {
                    appendLog(`Migrating ${problems.length} problems...`);
                    const safeProblems = problems.map(p => {
                        // Strip out deprecated 'hintIds' property if it exists in old local data
                        const { hintIds, ...cleanProblem } = p as any;

                        return {
                            ...cleanProblem,
                            topicIds: (p.topicIds || []).map((t: any) => typeof t === 'string' ? t : t.id),
                            hints: (p.hints || hintIds || []).map((h: any) => typeof h === 'string' ? h : h.id)
                        };
                    });
                    const { error } = await supabase.from('problems').upsert(safeProblems);
                    if (error) throw new Error(`Supabase Problems Error: ${error.message}`);
                    appendLog("Successfully migrated problems.");
                }

            } else {
                appendLog("No study items found in local storage.");
            }

            setStatus("success");
            appendLog("✅ MIGRATION COMPLETE!");

        } catch (err: any) {
            setStatus("error");
            appendLog(`❌ ERROR: ${err.message}`);
            console.error(err);
        }
    };

    const wipeStorage = () => {
        if (confirm("Are you incredibly sure? This will wipe the browser's local API storage forever.")) {
            localStorage.removeItem("topics");
            localStorage.removeItem("study_items");
            appendLog("✅ 🗑️ LocalStorage has been completely wiped.");
            setStatus("idle");
            alert("Local storage wiped successfully!");
        }
    };

    return (
        <div className="container max-w-2xl mx-auto pt-12">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Database className="w-8 h-8 text-primary" />
                        <div>
                            <CardTitle>Supabase Data Migration</CardTitle>
                            <CardDescription>Transfer your local browser data into the remote Supabase database.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-muted p-4 rounded-md text-sm border border-border">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                            Before you begin
                        </h4>
                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                            <li>Ensure you have run <code className="bg-background px-1 rounded">schema.sql</code> in your Supabase project.</li>
                            <li>Ensure <code className="bg-background px-1 rounded">.env.local</code> contains your Supabase keys.</li>
                            <li>This script will read <code className="bg-background px-1 rounded">localStorage</code> from this exact browser window and push it to Supabase.</li>
                        </ul>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                        <Button
                            className="flex-1 font-bold"
                            onClick={runMigration}
                            disabled={status === "migrating" || status === "success"}
                        >
                            {status === "success" ? (
                                <><CheckCircle className="w-4 h-4 mr-2" /> Migration Complete</>
                            ) : status === "migrating" ? (
                                "Migrating..."
                            ) : "Run Migration"}
                        </Button>

                        <Button
                            variant="destructive"
                            className="font-bold flex-1 sm:flex-none"
                            onClick={wipeStorage}
                            disabled={status === "migrating"}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Wipe Local Storage
                        </Button>
                    </div>

                    <div className="bg-background border border-input rounded-md p-4 min-h-[200px] font-mono text-xs overflow-y-auto">
                        <p className="text-muted-foreground mb-2">Migration logs:</p>
                        {logs.map((log, idx) => (
                            <div key={idx} className={log.includes("ERROR") ? "text-destructive" : log.includes("✅") ? "text-green-500" : "text-foreground"}>
                                &gt; {log}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
