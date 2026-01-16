
"use client";

import { Button } from "@/components/ui/button";
import { useSpaceData } from "@/context/space-data-context";
import { useSpace } from "@/context/space-context";
import { useFirebase } from "@/firebase";
import { useEffect, useState, useMemo } from "react";
import { FirestoreQuestion } from "@/services/firestore";

interface OpenQueriesProps {
    onQuestionSelect: (id: string, question: string) => void;
}

// Simplified relevance calculation based on static relevance field
const calculateRelevance = (question: FirestoreQuestion & { questionId: string }): number => {
    const relevanceOrder = { high: 2, medium: 1, low: 0 };
    return relevanceOrder[question.relevance] || 0;
};

export function OpenQueries({ onQuestionSelect }: OpenQueriesProps) {
    const { questions } = useSpaceData();
    const { user } = useFirebase();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const sortedQueries = useMemo(() => {
        if (!isClient || !user) return [];

        // Filter questions that the current user hasn't authored
        // In Firestore model, we have flat questions (no nested follow-ups in the same structure)
        const openQueries = questions.filter(q => q.askedBy !== user.uid);

        // Sort based on relevance score
        return openQueries.sort((a, b) => calculateRelevance(b) - calculateRelevance(a));
    }, [questions, user, isClient]);


    if (!isClient) {
        return null;
    }

    return (
        <div className="space-y-2">
            {sortedQueries.map(query => (
                <Button
                    key={query.questionId}
                    variant="outline"
                    className="w-full justify-start h-auto text-left whitespace-normal"
                    onClick={() => onQuestionSelect(query.questionId, query.question)}
                >
                    {query.isFollowUp ? `Follow-up: ${query.question}` : query.question}
                </Button>
            ))}
             {sortedQueries.length === 0 && (
                <p className="text-center text-muted-foreground">No open questions right now.</p>
            )}
        </div>
    );
}
