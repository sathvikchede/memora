
"use client";

import { Button } from "@/components/ui/button";
import { useInformation, Question } from "@/context/information-context";
import { useEffect, useState } from "react";

interface OpenQueriesProps {
    onQuestionSelect: (id: string, question: string) => void;
}

export function OpenQueries({ onQuestionSelect }: OpenQueriesProps) {
    const { questions } = useInformation();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);


    if (!isClient) {
        // You can return a loader or null here to prevent hydration mismatch
        return null;
    }

    // Create a flat list of all questions and follow-ups
    const allQueries: (Question & { displayText: string })[] = [];
    questions.forEach(q => {
        allQueries.push({ ...q, displayText: q.question });
        q.answers.forEach(a => {
            a.followUps.forEach(fu => {
                allQueries.push({ ...fu, displayText: `Follow-up: ${fu.question}` });
            });
        });
    });

    const relevanceOrder = { high: 0, medium: 1, low: 2 };
    const sortedQueries = allQueries.sort((a, b) => relevanceOrder[a.relevance] - relevanceOrder[b.relevance]);

    return (
        <div className="space-y-2">
            {sortedQueries.map(query => (
                <Button 
                    key={query.id} 
                    variant="outline" 
                    className="w-full justify-start h-auto text-left whitespace-normal"
                    onClick={() => onQuestionSelect(query.parentId || query.id, query.question)}
                >
                    {query.displayText}
                </Button>
            ))}
        </div>
    );
}
