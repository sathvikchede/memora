
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface Author {
    name: string;
    department: string;
    avatar: string;
}

export interface Answer {
    id: string;
    text: string;
    author: Author;
    upvotes: number;
    downvotes: number;
    followUps: Question[];
}

export interface Question {
    id: string;
    question: string;
    author: Author;
    answers: Answer[];
    relevance: 'high' | 'medium' | 'low';
    isFollowUp?: boolean;
    parentId?: string;
}


export interface Entry {
    id: string;
    text: string;
    contributor: string;
    date: string;
    type: 'add' | 'help' | 'message' | 'question' | 'answer' | 'follow-up';
    status?: 'success' | 'adjusted' | 'mismatch';
    question?: string; // for type 'question'
    questionId?: string; // for type 'answer' and 'follow-up'
}

interface InformationContextType {
    entries: Entry[];
    addEntry: (entry: Entry) => void;
    questions: Question[];
    addQuestion: (question: Question) => void;
    addAnswer: (questionId: string, answer: Omit<Answer, 'followUps' | 'id'>) => void;
    addFollowUp: (answerId: string, followUp: Omit<Question, 'answers' | 'relevance'>) => void;
}

const InformationContext = createContext<InformationContextType | undefined>(undefined);

const defaultQuestions: Question[] = [
    { 
        id: "q1", 
        question: "How to set up Firebase Authentication in a Next.js app?", 
        relevance: "high",
        author: { name: "John Doe", department: "Computer Science", avatar: "/avatars/john.png" },
        answers: [
            {
                id: "a1",
                text: "You can use the official 'firebase' package. First, you need to create a Firebase project and get your configuration keys. Then, initialize Firebase in a client-side component. After that, you can use the auth functions like `signInWithPopup` or `onAuthStateChanged` to manage user sessions. It's quite straightforward once you get the config set up properly.",
                author: { name: "Jane Smith", department: "Software Engineering", avatar: "/avatars/jane.png" },
                upvotes: 12,
                downvotes: 1,
                followUps: [
                     {
                        id: "f1",
                        question: "Thanks! How do you handle protecting routes for authenticated users?",
                        isFollowUp: true,
                        parentId: "q1",
                        author: { name: "John Doe", department: "Computer Science", avatar: "/avatars/john.png" },
                        relevance: 'medium',
                        answers: [{
                            id: "fa1",
                            text: "You can use a higher-order component (HOC) or a React Hook that checks the user's authentication state. If the user is not logged in, you can redirect them to the login page. This prevents unauthorized access to sensitive parts of your application.",
                            author: { name: "Jane Smith", department: "Software Engineering", avatar: "/avatars/jane.png" },
                            upvotes: 8,
                            downvotes: 0,
                            followUps: []
                        }]
                    }
                ]
            }
        ]
    },
    { 
        id: "q2", 
        question: "What are the best practices for state management in React?", 
        relevance: "high",
        author: { name: "Current User", department: "Your Department", avatar: "/avatars/user.png" },
        answers: []
    },
    { 
        id: "q4", 
        question: "How to deploy a Next.js app to Vercel?", 
        relevance: "low",
        author: { name: "Emily White", department: "DevOps", avatar: "/avatars/emily.png" },
        answers: []
    },
];


export const InformationProvider = ({ children }: { children: ReactNode }) => {
    const [entries, setEntries] = useState<Entry[]>(() => {
        if (typeof window !== 'undefined') {
            const savedEntries = localStorage.getItem('memora-entries');
            return savedEntries ? JSON.parse(savedEntries) : [];
        }
        return [];
    });

     const [questions, setQuestions] = useState<Question[]>(() => {
        if (typeof window !== 'undefined') {
            const savedQuestions = localStorage.getItem('memora-questions');
            return savedQuestions ? JSON.parse(savedQuestions) : defaultQuestions;
        }
        return defaultQuestions;
    });

    useEffect(() => {
        localStorage.setItem('memora-entries', JSON.stringify(entries));
    }, [entries]);

     useEffect(() => {
        localStorage.setItem('memora-questions', JSON.stringify(questions));
    }, [questions]);

    const addEntry = (entry: Entry) => {
        setEntries(prevEntries => [...prevEntries, entry]);
    };

    const addQuestion = (question: Omit<Question, 'id' | 'answers' | 'relevance'> & { question: string }) => {
        const newQuestion: Question = {
            ...question,
            id: `q-${Date.now()}`,
            answers: [],
            relevance: 'medium', // Default relevance
        };
        setQuestions(prevQuestions => [newQuestion, ...prevQuestions]);
    };

    const addAnswer = (questionId: string, answer: Omit<Answer, 'followUps'|'id'>) => {
        const newAnswer: Answer = { ...answer, id: `a-${Date.now()}`, followUps: [] };
        
        const findAndAddAnswer = (qs: Question[]): Question[] => {
            return qs.map(q => {
                if (q.id === questionId) {
                    return { ...q, answers: [...q.answers, newAnswer] };
                }
                if (q.answers) {
                    const updatedAnswers = q.answers.map(a => {
                       const updatedFollowUps = findAndAddAnswer(a.followUps);
                       return {...a, followUps: updatedFollowUps};
                    });
                    return { ...q, answers: updatedAnswers };
                }
                return q;
            });
        };

        setQuestions(prev => findAndAddAnswer(prev));
    };

     const addFollowUp = (answerId: string, followUp: Omit<Question, 'answers' | 'relevance'| 'id'>) => {
        const newFollowUp: Question = {
            ...followUp,
            id: `f-${Date.now()}`,
            answers: [],
            relevance: 'medium',
            isFollowUp: true,
        };

        const findAndAddFollowUp = (qs: Question[]): Question[] => {
            return qs.map(q => {
                const updatedAnswers = q.answers.map(a => {
                    if (a.id === answerId) {
                        return { ...a, followUps: [...a.followUps, newFollowUp] };
                    }
                     const updatedFollowUps = findAndAddFollowUp(a.followUps);
                     return {...a, followUps: updatedFollowUps};
                });
                return { ...q, answers: updatedAnswers };
            });
        };
        setQuestions(prev => findAndAddFollowUp(prev));
    };


    return (
        <InformationContext.Provider value={{ entries, addEntry, questions, addQuestion, addAnswer, addFollowUp }}>
            {children}
        </InformationContext.Provider>
    );
};

export const useInformation = () => {
    const context = useContext(InformationContext);
    if (context === undefined) {
        throw new Error('useInformation must be used within an InformationProvider');
    }
    return context;
};
