"use client";

import { Button } from "@/components/ui/button";

const fakeYourResponses = [
    { id: "q2", question: "What are the best practices for state management in React?", answered: "You answered the main question." },
    { id: "q3", question: "Follow-up: How does that compare to using Redux?", parentId: "q2", answered: "You answered a follow-up." },
];

interface YourResponsesProps {
    onQuestionSelect: (id: string, question: string) => void;
}

export function YourResponses({ onQuestionSelect }: YourResponsesProps) {
    return (
        <div className="space-y-2">
            {fakeYourResponses.map(query => (
                <Button 
                    key={query.id} 
                    variant="outline" 
                    className="w-full justify-start h-auto text-left whitespace-normal"
                    onClick={() => onQuestionSelect(query.parentId || query.id, query.question)}
                >
                    {query.question}
                </Button>
            ))}
             {fakeYourResponses.length === 0 && (
                <p className="text-center text-muted-foreground">You haven't responded to any questions yet.</p>
            )}
        </div>
    );
}
