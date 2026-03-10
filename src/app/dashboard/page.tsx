"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/db/api";
import { StudyItem, Topic } from "@/lib/db/models";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrainCircuit, BookOpen, Layers } from "lucide-react";

export default function Dashboard() {
    const [items, setItems] = useState<StudyItem[]>([]);
    const [dueItems, setDueItems] = useState<StudyItem[]>([]);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            const [all, due, allTopics] = await Promise.all([
                api.items.list(),
                api.items.getDueItems(),
                api.topics.list()
            ]);
            setItems(all);
            // Filter due items to only include concepts, matching the review session logic
            setDueItems(due.filter(i => i.type === "concept"));
            setTopics(allTopics);
            setLoading(false);
        }
        loadData();
    }, []);

    const conceptsCount = items.filter(i => i.type === "concept").length;
    const problemsCount = items.filter(i => i.type === "problem").length;

    return (
        <div className="container mx-auto py-10 px-4 md:px-6 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Overview of your knowledge base and study sessions.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Due for Review</CardTitle>
                        <BrainCircuit className="w-4 h-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? "-" : dueItems.length}</div>
                        <p className="text-xs text-muted-foreground mt-1">Concepts ready for study</p>
                    </CardContent>
                    <CardFooter>
                        <Link href="/review" className="w-full">
                            <Button className="w-full" disabled={dueItems.length === 0 || loading}>Start Session</Button>
                        </Link>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Total Concepts</CardTitle>
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? "-" : conceptsCount}</div>
                    </CardContent>
                    <CardFooter>
                        <Link href="/knowledge" className="w-full">
                            <Button variant="outline" className="w-full">Manage Base</Button>
                        </Link>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Total Problems</CardTitle>
                        <Layers className="w-4 h-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{loading ? "-" : problemsCount}</div>
                    </CardContent>
                    <CardFooter>
                        <Link href="/problems" className="w-full">
                            <Button variant="outline" className="w-full">Manage Problems</Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Topics Overview</CardTitle>
                        <CardDescription>Mastery breakdown by subject.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {loading ? (
                            <div className="text-sm text-muted-foreground">Loading topics...</div>
                        ) : topics.length === 0 ? (
                            <div className="text-sm text-muted-foreground italic py-4">No topics created yet. Tag your concepts to see them here!</div>
                        ) : (
                            <div className="space-y-3">
                                {topics.map(topic => {
                                    const topicItems = items.filter(i => (i.topicIds || []).includes(topic.id));
                                    const topicDue = dueItems.filter(i => (i.topicIds || []).includes(topic.id));
                                    const percentage = topicItems.length > 0
                                        ? Math.round(((topicItems.length - topicDue.length) / topicItems.length) * 100)
                                        : 0;

                                    return (
                                        <div key={topic.id} className="flex flex-col gap-1.5">
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: topic.color }} />
                                                    <span className="font-medium">{topic.name}</span>
                                                </div>
                                                <span className="text-muted-foreground">{topicItems.length} items ({topicDue.length} due)</span>
                                            </div>
                                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full transition-all duration-500"
                                                    style={{
                                                        width: `${percentage}%`,
                                                        backgroundColor: topic.color,
                                                        opacity: 0.7
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Quick Links</CardTitle>
                        <CardDescription>Access your study materials faster.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3">
                        <Link href="/knowledge/new">
                            <Button variant="outline" className="w-full justify-start h-12 bg-primary/5 border-primary/20 hover:bg-primary/10">
                                <BookOpen className="w-4 h-4 mr-2 text-primary" />
                                New Concept
                            </Button>
                        </Link>
                        <Link href="/problems/new">
                            <Button variant="outline" className="w-full justify-start h-12 bg-primary/5 border-primary/20 hover:bg-primary/10">
                                <Layers className="w-4 h-4 mr-2 text-primary" />
                                New Problem
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
