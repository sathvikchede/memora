
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface Author {
    id: string;
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

const USERS: Author[] = [
    { id: 'user-1', name: 'Alex', department: 'Engineering', avatar: '/avatars/alex.png' },
    { id: 'user-2', name: 'Ben', department: 'Product', avatar: '/avatars/ben.png' },
    { id: 'user-3', name: 'Clara', department: 'Design', avatar: '/avatars/clara.png' },
];

interface InformationContextType {
    entries: Entry[];
    addEntry: (entry: Entry) => void;
    questions: Question[];
    addQuestion: (question: Omit<Question, 'id' | 'answers' | 'relevance'>) => void;
    addAnswer: (questionId: string, answer: Omit<Answer, 'followUps' | 'id'>, originalQuestion: string) => void;
    addFollowUp: (answerId: string, followUp: Omit<Question, 'answers' | 'relevance' | 'id'>, originalQuestion: string) => void;
    users: Author[];
    currentUser: Author;
    setCurrentUser: (user: Author) => void;
}

const InformationContext = createContext<InformationContextType | undefined>(undefined);

const defaultQuestions: Question[] = [];

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

    const [currentUser, setCurrentUserInternal] = useState<Author>(() => {
        if (typeof window !== 'undefined') {
            const savedUser = localStorage.getItem('memora-current-user');
            return savedUser ? JSON.parse(savedUser) : USERS[0];
        }
        return USERS[0];
    });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('memora-entries', JSON.stringify(entries));
        }
    }, [entries]);

     useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('memora-questions', JSON.stringify(questions));
        }
    }, [questions]);

    const setCurrentUser = (user: Author) => {
        setCurrentUserInternal(user);
        if (typeof window !== 'undefined') {
            localStorage.setItem('memora-current-user', JSON.stringify(user));
        }
    };


    const addEntry = (entry: Entry) => {
        setEntries(prevEntries => [...prevEntries, entry]);
    };

    const addQuestion = (question: Omit<Question, 'id' | 'answers' | 'relevance'>) => {
        const newQuestion: Question = {
            ...question,
            id: `q-${Date.now()}`,
            answers: [],
            relevance: 'medium', // Default relevance
        };
        setQuestions(prevQuestions => [newQuestion, ...prevQuestions]);
        addEntry({
            id: `entry-${Date.now()}`,
            text: `Question: ${question.question}`,
            contributor: question.author.name,
            date: new Date().toISOString().split('T')[0],
            type: 'question',
            question: question.question,
        });
    };

    const addAnswer = (questionId: string, answer: Omit<Answer, 'followUps'|'id'>, originalQuestion: string) => {
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
         addEntry({
            id: `entry-${Date.now()}`,
            text: `In response to "${originalQuestion}", the answer is: ${answer.text}`,
            contributor: answer.author.name,
            date: new Date().toISOString().split('T')[0],
            type: 'answer',
            question: originalQuestion,
            questionId: questionId,
        });
    };

     const addFollowUp = (answerId: string, followUp: Omit<Question, 'answers' | 'relevance'| 'id'>, originalQuestion: string) => {
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
        addEntry({
            id: `entry-${Date.now()}`,
            text: `A follow-up to "${originalQuestion}" asks: ${followUp.question}`,
            contributor: followUp.author.name,
            date: new Date().toISOString().split('T')[0],
            type: 'follow-up',
            question: followUp.question,
            questionId: followUp.parentId
        });
    };


    return (
        <InformationContext.Provider value={{ entries, addEntry, questions, addQuestion, addAnswer, addFollowUp, users: USERS, currentUser, setCurrentUser }}>
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

    