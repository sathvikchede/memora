
"use client";

import { Button } from "@/components/ui/button";
import { useSpaceData } from "@/context/space-data-context";
import { useFirebase } from "@/firebase";
import { useState, useEffect, useMemo } from "react";

interface YourResponsesProps {
    onQuestionSelect: (id: string, question: string) => void;
}

export function YourResponses({ onQuestionSelect }: YourResponsesProps) {
    const { questions } = useSpaceData();
    const { user } = useFirebase();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const yourResponses = useMemo(() => {
        if (!isClient || !user) return [];

        const responses: { id: string; question: string }[] = [];

        // Find questions where the current user has provided an answer
        questions.forEach(q => {
            const hasYourAnswer = q.answers?.some(a => a.authorId === user.uid);
            if (hasYourAnswer) {
                // Avoid duplicates
                if (!responses.some(res => res.id === q.questionId)) {
                    responses.push({
                        id: q.questionId,
                        question: q.question
                    });
                }
            }
        });

        return responses;
    }, [questions, user, isClient]);

    if (!isClient) {
        return null;
    }

    return (
        <div className="space-y-2">
            {yourResponses.map(query => (
                <Button
                    key={query.id}
                    variant="outline"
                    className="w-full justify-start h-auto text-left whitespace-normal"
                    onClick={() => onQuestionSelect(query.id, query.question)}
                >
                    You answered: {query.question}
                </Button>
            ))}
             {yourResponses.length === 0 && (
                <p className="text-center text-muted-foreground">You haven't responded to any questions yet.</p>
            )}
        </div>
    );
}
