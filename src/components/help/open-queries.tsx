"use client";

import { Button } from "@/components/ui/button";

const fakeQueries = [
    { id: "q1", question: "How to set up Firebase Authentication in a Next.js app?", relevance: "high" },
    { id: "q2", question: "What are the best practices for state management in React?", relevance: "high" },
    { id: "q3", followUp: "Follow-up: How does that compare to using Redux?", parentId: "q2", relevance: "medium" },
    { id: "q4", question: "How to deploy a Next.js app to Vercel?", relevance: "low" },
];

interface OpenQueriesProps {
    onQuestionSelect: (id: string, question: string) => void;
}

export function OpenQueries({ onQuestionSelect }: OpenQueriesProps) {
    
    const getQuestionText = (query: any) => {
        if(query.followUp) {
            return query.followUp;
        }
        return query.question;
    }
    
    return (
        <div className="space-y-2">
            {fakeQueries.map(query => (
                <Button 
                    key={query.id} 
                    variant="outline" 
                    className="w-full justify-start h-auto text-left whitespace-normal"
                    onClick={() => onQuestionSelect(query.parentId || query.id, getQuestionText(query))}
                >
                    {getQuestionText(query)}
                </Button>
            ))}
        </div>
    );
}
