"use client";

import { Button } from "@/components/ui/button";

const fakeYourQueries = [
    { id: "q1", question: "How to set up Firebase Authentication in a Next.js app?" },
];

interface YourQueriesProps {
    onQuestionSelect: (id: string, question: string) => void;
}

export function YourQueries({ onQuestionSelect }: YourQueriesProps) {
    return (
        <div className="space-y-2">
            {fakeYourQueries.map(query => (
                <Button 
                    key={query.id} 
                    variant="outline" 
                    className="w-full justify-start h-auto text-left whitespace-normal"
                    onClick={() => onQuestionSelect(query.id, query.question)}
                >
                    {query.question}
                </Button>
            ))}
            {fakeYourQueries.length === 0 && (
                <p className="text-center text-muted-foreground">You haven't posted any questions yet.</p>
            )}
        </div>
    );
}
