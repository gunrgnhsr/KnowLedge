"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/db/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarkdownEditor } from "@/components/editor/RichTextEditor";
import { ArrowLeft, Tags } from "lucide-react";
import Link from "next/link";
import { TopicSelector } from "@/components/topics/TopicSelector";

export default function NewConcept() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [topicIds, setTopicIds] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;

        setIsSubmitting(true);
        try {
            await api.items.createConcept({
                title,
                content,
                topicIds,
            });
            router.push("/knowledge");
        } catch (err) {
            console.error(err);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto py-10 px-4 md:px-6 max-w-4xl space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/knowledge">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">New Concept</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-2">
                    <Label htmlFor="title" className="text-lg font-semibold">Concept Title</Label>
                    <Input
                        id="title"
                        placeholder="e.g. Asymptotic Notation (Big O)"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="text-lg py-6 focus-visible:ring-primary shadow-sm"
                        required
                        autoFocus
                    />
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <Label className="text-lg font-semibold">Topics</Label>
                        <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Tags className="w-3 h-3" />
                            Mandatory
                        </span>
                    </div>
                    <TopicSelector
                        selectedTopicIds={topicIds}
                        onTopicChange={setTopicIds}
                    />
                </div>

                <div className="space-y-2 flex flex-col h-[500px]">
                    <Label className="text-lg font-semibold">Content & Definitions</Label>
                    <MarkdownEditor
                        content={content}
                        onChange={setContent}
                        placeholder="Write down the concept details..."
                    />
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <Link href="/knowledge">
                        <Button type="button" variant="outline" size="lg">Cancel</Button>
                    </Link>
                    <Button type="submit" size="lg" disabled={isSubmitting || !title || !content || topicIds.length === 0}>
                        {isSubmitting ? "Saving..." : "Save Concept"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
