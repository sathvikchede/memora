
"use client";

import { Button } from "@/components/ui/button";
import { useSpaceData } from "@/context/space-data-context";
import { useFirebase } from "@/firebase";
import { useState, useEffect, useMemo } from "react";

interface YourQueriesProps {
    onQuestionSelect: (id: string, question: string) => void;
}

export function YourQueries({ onQuestionSelect }: YourQueriesProps) {
    const { questions } = useSpaceData();
    const { user } = useFirebase();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const yourQueries = useMemo(() => {
        if (!isClient || !user) return [];
        return questions.filter(q => q.askedBy === user.uid);
    }, [questions, user, isClient]);

    if (!isClient) {
        return null;
    }

    return (
        <div className="space-y-2">
            {yourQueries.map(query => (
                <Button
                    key={query.questionId}
                    variant="outline"
                    className="w-full justify-start h-auto text-left whitespace-normal"
                    onClick={() => onQuestionSelect(query.questionId, query.question)}
                >
                    {query.question}
                </Button>
            ))}
            {yourQueries.length === 0 && (
                <p className="text-center text-muted-foreground">You haven't posted any questions yet.</p>
            )}
        </div>
    );
}
