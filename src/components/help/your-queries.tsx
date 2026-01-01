
"use client";

import { Button } from "@/components/ui/button";
import { useInformation } from "@/context/information-context";
import { useState, useEffect } from "react";

interface YourQueriesProps {
    onQuestionSelect: (id: string, question: string) => void;
}

export function YourQueries({ onQuestionSelect }: YourQueriesProps) {
    const { questions } = useInformation();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return null; // or a loading skeleton
    }
    
    // This is a mock user check. In a real app, you'd get the current user's ID.
    const currentUser = "Current User"; 
    const yourQueries = questions.filter(q => q.author.name === currentUser);

    return (
        <div className="space-y-2">
            {yourQueries.map(query => (
                <Button 
                    key={query.id} 
                    variant="outline" 
                    className="w-full justify-start h-auto text-left whitespace-normal"
                    onClick={() => onQuestionSelect(query.id, query.question)}
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
