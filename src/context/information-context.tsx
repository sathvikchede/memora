
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface Club {
  id: string;
  name: string;
  position: string;
}

export interface WorkExperience {
  id: string;
  organization: string;
  employmentType: 'intern' | 'full-time';
  position: string;
  startDate: string;
  endDate: string;
}
export interface Author {
    id: string;
    name: string;
    department: string;
    avatar: string;
    year: string;
    clubs: Club[];
    workExperience: WorkExperience[];
}

export interface Answer {
    id:string;
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
    { 
        id: 'user-1', 
        name: 'Alex', 
        department: 'Engineering', 
        avatar: '/avatars/alex.png',
        year: '3rd Year',
        clubs: [
            { id: 'c1', name: 'AI Club', position: 'President' },
            { id: 'c2', name: 'Debate Club', position: 'Member' },
        ],
        workExperience: [
            { id: 'w1', organization: 'Google', employmentType: 'intern', position: 'Software Engineer Intern', startDate: '01062023', endDate: '31082023' }
        ]
    },
    { 
        id: 'user-2', 
        name: 'Ben', 
        department: 'Product', 
        avatar: '/avatars/ben.png',
        year: '4th Year',
        clubs: [
            { id: 'c3', name: 'Entrepreneurship Club', position: 'Vice President' }
        ],
        workExperience: []
    },
    { d: 'user-3', name: 'Clara', department: 'Design', avatar: '/avatars/clara.png', year: '2nd Year', clubs: [], workExperience: [] },
];

const initialQuestions: Question[] = [
    {
        id: 'q1',
        question: 'What is the best way to learn React?',
        author: USERS[1],
        answers: [
            {
                id: 'a1-1',
                text: 'The official React documentation is a great place to start. It\'s comprehensive and always up-to-date.',
                author: USERS[0],
                upvotes: 15,
                downvotes: 1,
                followUps: [
                    {
                        id: 'f1-1-1',
                        question: 'Thanks! Any specific projects you\'d recommend for beginners?',
                        author: USERS[1],
                        answers: [
                             {
                                id: 'fa1-1',
                                text: 'Build a to-do list app. It covers all the basics: state management, props, and event handling.',
                                author: USERS[2],
                                upvotes: 10,
                                downvotes: 0,
                                followUps: [],
                            }
                        ],
                        relevance: 'high',
                        isFollowUp: true,
                        parentId: 'q1'
                    }
                ]
            },
            {
                id: 'a1-2',
                text: 'I found that building a small project, like a personal blog or a weather app, helped solidify my understanding.',
                author: USERS[2],
                upvotes: 8,
                downvotes: 0,
                followUps: []
            }
        ],
        relevance: 'high',
    },
    {
        id: 'q2',
        question: 'How does CSS Grid differ from Flexbox?',
        author: USERS[2],
        answers: [],
        relevance: 'medium'
    },
    {
        id: 'q3',
        question: 'What are the benefits of using TypeScript with React?',
        author: USERS[0],
        answers: [],
        relevance: 'low'
    }
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
    upvoteAnswer: (questionId: string, answerId: string) => void;
    downvoteAnswer: (questionId: string, answerId: string) => void;
    isReady: boolean;
}

const InformationContext = createContext<InformationContextType | undefined>(undefined);

export const InformationProvider = ({ children }: { children: ReactNode }) => {
    const [entries, setEntries] = useState<Entry[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentUser, setCurrentUserInternal] = useState<Author>(USERS[0]);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedEntries = localStorage.getItem('memora-entries');
            // For testing, let's start with no entries.
            // if (savedEntries) setEntries(JSON.parse(savedEntries));

            const savedQuestions = localStorage.getItem('memora-questions');
            if (savedQuestions && JSON.parse(savedQuestions).length > 0) {
                 setQuestions(JSON.parse(savedQuestions));
            } else {
                setQuestions(initialQuestions);
            }
            
            const savedUser = localStorage.getItem('memora-current-user');
            if(savedUser) {
                const userToSet = USERS.find(u => u.id === JSON.parse(savedUser).id) || USERS[0];
                setCurrentUserInternal(userToSet);
            } else {
                setCurrentUserInternal(USERS[0]);
            }
            setIsReady(true);
        }
    }, []);

    useEffect(() => {
        if (isReady) {
            localStorage.setItem('memora-entries', JSON.stringify(entries));
        }
    }, [entries, isReady]);

     useEffect(() => {
        if (isReady) {
            localStorage.setItem('memora-questions', JSON.stringify(questions));
        }
    }, [questions, isReady]);

    const setCurrentUser = (user: Author) => {
        setCurrentUserInternal(user);
        if (typeof window !== 'undefined') {
            localStorage.setItem('memora-current-user', JSON.stringify(user));
        }
    };

    const addEntry = (entry: Entry) => {
        setEntries(prevEntries => [...prevEntries, { ...entry, id: `entry-${Date.now()}` }]);
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

    const updateVotes = (questionId: string, answerId: string, voteType: 'up' | 'down') => {
        const findAndUpdate = (qs: Question[]): Question[] => {
            return qs.map(q => {
                const updatedAnswers = q.answers.map(a => {
                    if (a.id === answerId && (q.id === questionId || q.parentId === questionId)) {
                        return {
                            ...a,
                            upvotes: voteType === 'up' ? a.upvotes + 1 : a.upvotes,
                            downvotes: voteType === 'down' ? a.downvotes + 1 : a.downvotes,
                        };
                    }
                    if (a.followUps?.length > 0) {
                        return { ...a, followUps: findAndUpdate(a.followUps) };
                    }
                    return a;
                });

                return { ...q, answers: updatedAnswers };
            });
        };
        setQuestions(prev => findAndUpdate(prev));
    };

    const upvoteAnswer = (questionId: string, answerId: string) => {
        updateVotes(questionId, answerId, 'up');
    };

    const downvoteAnswer = (questionId: string, answerId: string) => {
        updateVotes(questionId, answerId, 'down');
    };

    return (
        <InformationContext.Provider value={{ entries, addEntry, questions, addQuestion, addAnswer, addFollowUp, users: USERS, currentUser, setCurrentUser, upvoteAnswer, downvoteAnswer, isReady }}>
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
