
"use client";

import { Button } from "@/components/ui/button";
import { useInformation, Question } from "@/context/information-context";

interface YourResponsesProps {
    onQuestionSelect: (id: string, question: string) => void;
}

export function YourResponses({ onQuestionSelect }: YourResponsesProps) {
    const { questions } = useInformation();
    const currentUser = "Current User"; 
    
    const yourResponses: {id: string, question: string, parentId?: string}[] = [];

    const findResponses = (qs: Question[]) => {
        qs.forEach(q => {
            q.answers.forEach(a => {
                if (a.author.name === currentUser) {
                    yourResponses.push({ id: q.id, question: q.question });
                }
                if (a.followUps) {
                    findResponses(a.followUps);
                }
            })
        })
    }

    findResponses(questions);


    return (
        <div className="space-y-2">
            {yourResponses.map(query => (
                <Button 
                    key={query.id} 
                    variant="outline" 
                    className="w-full justify-start h-auto text-left whitespace-normal"
                    onClick={() => onQuestionSelect(query.parentId || query.id, query.question)}
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
