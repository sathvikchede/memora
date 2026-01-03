
"use client";

import { Button } from "@/components/ui/button";
import { useInformation, Question, Author } from "@/context/information-context";
import { useEffect, useState, useMemo } from "react";

interface OpenQueriesProps {
    onQuestionSelect: (id: string, question: string) => void;
}

// Function to calculate relevance score
const calculateRelevance = (question: Question, user: Author): number => {
    let score = 0;
    const questionText = question.question.toLowerCase();
    
    // Check for department match
    if (user.department && questionText.includes(user.department.toLowerCase())) {
        score += 5;
    }
    
    // Check for club matches
    user.clubs?.forEach(club => {
        if (club.name && questionText.includes(club.name.toLowerCase())) {
            score += 3;
        }
        if (club.position && questionText.includes(club.position.toLowerCase())) {
            score += 2;
        }
    });

    // Check for work experience matches
    user.workExperience?.forEach(exp => {
        if (exp.organization && questionText.includes(exp.organization.toLowerCase())) {
            score += 3;
        }
        if (exp.position && questionText.includes(exp.position.toLowerCase())) {
            score += 2;
        }
    });

    // Bonus for static relevance
    const relevanceOrder = { high: 2, medium: 1, low: 0 };
    score += relevanceOrder[question.relevance] || 0;

    return score;
}


export function OpenQueries({ onQuestionSelect }: OpenQueriesProps) {
    const { questions, currentUser } = useInformation();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const sortedQueries = useMemo(() => {
        if (!isClient) return [];
        
        // Create a flat list of all questions and follow-ups that the current user hasn't authored
        const allQueries: (Question & { displayText: string })[] = [];
        const processQuestions = (qs: Question[], parentId?: string) => {
            qs.forEach(q => {
                if (q.author.id !== currentUser.id) {
                    allQueries.push({ 
                        ...q, 
                        displayText: q.isFollowUp ? `Follow-up: ${q.question}` : q.question,
                        parentId: parentId || q.id, // Ensure follow-ups point to the root question
                    });
                }
                q.answers.forEach(a => {
                    if (a.followUps?.length > 0) {
                        processQuestions(a.followUps, parentId || q.id);
                    }
                });
            });
        };
        processQuestions(questions);

        // Sort based on relevance score
        return allQueries.sort((a, b) => calculateRelevance(b, currentUser) - calculateRelevance(a, currentUser));
    }, [questions, currentUser, isClient]);


    if (!isClient) {
        // You can return a loader or null here to prevent hydration mismatch
        return null;
    }

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
