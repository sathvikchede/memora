
"use client";

import { Button } from "@/components/ui/button";
import { useInformation, Question } from "@/context/information-context";
import { useState, useEffect } from "react";

interface YourResponsesProps {
    onQuestionSelect: (id: string, question: string) => void;
}

export function YourResponses({ onQuestionSelect }: YourResponsesProps) {
    const { questions, currentUser } = useInformation();
    const [isClient, setIsClient] = useState(false);
    
    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return null;
    }
    
    const yourResponses: {id: string, question: string, rootQuestion: string}[] = [];

    const findResponses = (qs: Question[], rootQuestion: Question) => {
        qs.forEach(q => {
            q.answers.forEach(a => {
                if (a.author.id === currentUser.id) {
                    // Always add the root question's ID and text for navigation
                    if(!yourResponses.some(res => res.id === rootQuestion.id)) {
                        yourResponses.push({ id: rootQuestion.id, question: q.question, rootQuestion: rootQuestion.question });
                    }
                }
                if (a.followUps) {
                    // Pass the same rootQuestion down the recursion
                    findResponses(a.followUps, rootQuestion);
                }
            })
        })
    }

    // Iterate through top-level questions, treating each as a potential root
    questions.forEach(rootQ => {
        findResponses([rootQ], rootQ);
    });

    return (
        <div className="space-y-2">
            {yourResponses.map(query => (
                <Button 
                    key={query.id} 
                    variant="outline" 
                    className="w-full justify-start h-auto text-left whitespace-normal"
                    // Navigate using the root question's ID and text
                    onClick={() => onQuestionSelect(query.id, query.rootQuestion)}
                >
                    You answered: {query.rootQuestion}
                </Button>
            ))}
             {yourResponses.length === 0 && (
                <p className="text-center text-muted-foreground">You haven't responded to any questions yet.</p>
            )}
        </div>
    );
}
