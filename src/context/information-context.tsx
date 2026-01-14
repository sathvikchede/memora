
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Summary, getAllSummaries as getStorageSummaries } from '@/services/storage';

// Interfaces for our data structures
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
    startDate: string; // DDMMYYYY
    endDate: string; // DDMMYYYY
}

export interface Author {
    id: string;
    name: string;
    avatar: string;
    year: string;
    department: string;
    clubs: Club[];
    workExperience: WorkExperience[];
    creditBalance: number;
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
    parentId?: string; // If it's a follow-up, this points to the root question
}

export interface Entry {
    id: string;
    userId: string;
    text: string;
    contributor: string;
    date: string;
    type: 'add' | 'help' | 'message' | 'question' | 'answer' | 'follow-up';
    status?: 'success' | 'adjusted' | 'mismatch';
    question?: string; // for type 'question'
    questionId?: string; // for type 'answer' and 'follow-up'
}

export interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  showActions?: boolean;
}

export interface ChatHistoryItem {
    id: string;
    userId: string;
    title: string;
    date: string;
    messages: Message[];
    sources: any[];
}


export interface ChatMessage {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    timestamp: string;
    remembered: boolean;
    attachments?: { type: 'image' | 'file', url: string, name: string }[];
}

// Re-export Summary type for convenience
export type { Summary } from '@/services/storage';

// LocalStorage keys
const ENTRIES_KEY = 'memora-entries';
const QUESTIONS_KEY = 'memora-questions';
const CHAT_MESSAGES_KEY = 'memora-chat-messages';
const CHAT_HISTORY_KEY = 'memora-chat-history';
const USERS_KEY = 'memora-users';
const CURRENT_USER_KEY = 'memora-current-user';

// Initial data for a fresh start
const initialUsers: Author[] = [
    { id: 'user-1', name: 'Alex', avatar: '/avatars/alex.png', year: '3rd Year', department: 'Engineering', clubs: [{id: 'c1', name: 'AI Club', position: 'President'}, {id: 'c2', name: 'Debate Club', position: 'Member'}], workExperience: [{id: 'w1', organization: 'Google', employmentType: 'intern', position: 'Software Engineer Intern', startDate: '01062023', endDate: '31082023'}], creditBalance: 0 },
    { id: 'user-2', name: 'Ben', avatar: '/avatars/ben.png', year: '4th Year', department: 'Product', clubs: [{id: 'c3', name: 'Entrepreneurship Club', position: 'Vice President'}], workExperience: [], creditBalance: 0 },
    { id: 'user-3', name: 'Clara', avatar: '/avatars/clara.png', year: '2nd Year', department: 'Design', clubs: [], workExperience: [], creditBalance: 0 },
    { id: 'user-4', name: 'David', avatar: '/avatars/david.png', year: '1st Year', department: 'Marketing', clubs: [], workExperience: [], creditBalance: 0 },
    { id: 'user-5', name: 'Eva', avatar: '/avatars/eva.png', year: '3rd Year', department: 'Data Science', clubs: [{id: 'c4', name: 'Coding Club', position: 'Treasurer'}], workExperience: [], creditBalance: 0 },
];


const initialQuestions: Question[] = [
    {
        id: 'q1',
        question: 'What is the best way to learn React?',
        author: initialUsers[1],
        answers: [
            {
                id: 'a1-1',
                text: 'The official React documentation is a great place to start. It\'s comprehensive and always up-to-date.',
                author: initialUsers[0],
                upvotes: 15,
                downvotes: 1,
                followUps: [
                    {
                        id: 'f1-1-1',
                        question: 'Thanks! Any specific projects you\'d recommend for beginners?',
                        author: initialUsers[1],
                        answers: [
                             {
                                id: 'fa1-1',
                                text: 'Build a to-do list app. It covers all the basics: state management, props, and event handling.',
                                author: initialUsers[2],
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
                author: initialUsers[2],
                upvotes: 8,
                downvotes: 0,
                followUps: []
            }
        ],
        relevance: 'high',
    },
    { id: 'q2', question: 'How does CSS Grid differ from Flexbox?', author: initialUsers[2], answers: [], relevance: 'medium' },
    { id: 'q3', question: 'What are the benefits of using TypeScript with React?', author: initialUsers[0], answers: [], relevance: 'low' }
];

interface InformationContextType {
    entries: Entry[];
    addEntry: (entry: Omit<Entry, 'id' | 'userId'>) => void;

    // Topic-level summaries (new system)
    summaries: Summary[];
    refreshSummaries: () => void;

    questions: Question[];
    addQuestion: (question: Omit<Question, 'id' | 'answers' | 'relevance'>) => void;
    addAnswer: (questionId: string, answer: Omit<Answer, 'followUps' | 'id'>, originalQuestion: string) => void;
    addFollowUp: (answerId: string, followUp: Omit<Question, 'answers' | 'relevance' | 'id'>, originalQuestion: string) => void;
    getQuestionById: (questionId: string) => Question | undefined;
    upvoteAnswer: (questionId: string, answerId: string) => void;
    downvoteAnswer: (questionId: string, answerId: string) => void;

    chatMessages: ChatMessage[];
    getChatMessages: (conversationId: string) => ChatMessage[];
    sendChatMessage: (conversationId: string, content: string, attachments: any[]) => void;
    rememberStates: Record<string, boolean>;
    getRememberState: (conversationId: string) => boolean;
    toggleRememberState: (conversationId: string) => void;

    chatHistory: ChatHistoryItem[];
    addHistoryItem: (title: string, messages: Message[], sources?: any[]) => ChatHistoryItem;
    addMessageToHistory: (chatId: string, message: Message, sources?: any[]) => void;
    getChatHistoryItem: (chatId: string) => ChatHistoryItem | undefined;

    users: Author[];
    currentUser: Author;
    setCurrentUser: (user: Author) => void;
    updateUser: (user: Author) => void;
    updateCreditBalance: (userId: string, amount: number) => void;

    isReady: boolean;
}

const InformationContext = createContext<InformationContextType | undefined>(undefined);

export const InformationProvider = ({ children }: { children: ReactNode }) => {
    const [entries, setEntries] = useState<Entry[]>([]);
    const [summaries, setSummaries] = useState<Summary[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
    const [users, setUsers] = useState<Author[]>([]);
    const [currentUser, setCurrentUserInternal] = useState<Author | null>(null);
    const [rememberStates, setRememberStates] = useState<Record<string, boolean>>({});
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Load all data from localStorage on initial client-side render
        const savedEntries = localStorage.getItem(ENTRIES_KEY);
        setEntries(savedEntries ? JSON.parse(savedEntries) : []);
        
        const savedQuestions = localStorage.getItem(QUESTIONS_KEY);
        setQuestions(savedQuestions ? JSON.parse(savedQuestions) : initialQuestions);

        const savedChatMessages = localStorage.getItem(CHAT_MESSAGES_KEY);
        setChatMessages(savedChatMessages ? JSON.parse(savedChatMessages) : []);

        const savedChatHistory = localStorage.getItem(CHAT_HISTORY_KEY);
        setChatHistory(savedChatHistory ? JSON.parse(savedChatHistory) : []);

        const savedUsers = localStorage.getItem(USERS_KEY);
        const finalUsers = savedUsers ? JSON.parse(savedUsers) : initialUsers;
        setUsers(finalUsers);

        const savedCurrentUser = localStorage.getItem(CURRENT_USER_KEY);
        if (savedCurrentUser) {
            const userToSet = finalUsers.find((u: Author) => u.id === JSON.parse(savedCurrentUser).id) || finalUsers[0];
            setCurrentUserInternal(userToSet);
        } else {
            setCurrentUserInternal(finalUsers[0]);
        }
        
        const savedRememberStates = localStorage.getItem('memora-remember-states');
        if (savedRememberStates) {
            setRememberStates(JSON.parse(savedRememberStates));
        }

        // Load summaries from the new storage system
        setSummaries(getStorageSummaries());

        setIsReady(true);
    }, []);

    // Function to refresh summaries from storage (call after processing entries)
    const refreshSummaries = useCallback(() => {
        setSummaries(getStorageSummaries());
    }, []);

    // Persist data to localStorage whenever it changes
    useEffect(() => { if(isReady) localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries)); }, [entries, isReady]);
    useEffect(() => { if(isReady) localStorage.setItem(QUESTIONS_KEY, JSON.stringify(questions)); }, [questions, isReady]);
    useEffect(() => { if(isReady) localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(chatMessages)); }, [chatMessages, isReady]);
    useEffect(() => { if(isReady) localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatHistory)); }, [chatHistory, isReady]);
    useEffect(() => { if(isReady) localStorage.setItem(USERS_KEY, JSON.stringify(users)); }, [users, isReady]);
    useEffect(() => { if(isReady && currentUser) localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser)); }, [currentUser, isReady]);
    useEffect(() => { if(isReady) localStorage.setItem('memora-remember-states', JSON.stringify(rememberStates)); }, [rememberStates, isReady]);

    // Handlers
    const addEntry = (entry: Omit<Entry, 'id' | 'userId'>) => {
        if (!currentUser) return;
        const newEntry = { ...entry, id: `entry-${Date.now()}`, userId: currentUser.id };
        setEntries(prev => [...prev, newEntry]);
    };

    const addQuestion = (question: Omit<Question, 'id' | 'answers' | 'relevance'>) => {
        const newQuestion: Question = {
            ...question,
            id: `q-${Date.now()}`,
            answers: [],
            relevance: 'medium', // Default relevance
        };
        setQuestions(prev => [newQuestion, ...prev]);

        addEntry({
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
        setQuestions(findAndAddAnswer);

         addEntry({
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

        setQuestions(findAndAddFollowUp);

        addEntry({
            text: `A follow-up to "${originalQuestion}" asks: ${followUp.question}`,
            contributor: followUp.author.name,
            date: new Date().toISOString().split('T')[0],
            type: 'follow-up',
            question: followUp.question,
            questionId: followUp.parentId
        });
    };

    const getQuestionById = useCallback((questionId: string): Question | undefined => {
        const findQuestion = (qs: Question[]): Question | undefined => {
            for (const q of qs) {
                if (q.id === questionId) return q;
                const foundInAnswers = q.answers.map(a => findQuestion(a.followUps)).find(Boolean);
                if (foundInAnswers) return foundInAnswers;
            }
            return undefined;
        };
        return findQuestion(questions);
    }, [questions]);
    
    const updateVotes = (questionId: string, answerId: string, voteType: 'up' | 'down') => {
        const findAndUpdate = (qs: Question[]): Question[] => {
            return qs.map(q => {
                // This check needs to be recursive for follow-up questions
                const updatedAnswers = q.answers.map(a => {
                    if (a.id === answerId && (q.id === questionId || q.parentId === questionId)) {
                        return {
                            ...a,
                            upvotes: voteType === 'up' ? a.upvotes + 1 : a.upvotes,
                            downvotes: voteType === 'down' ? a.downvotes + 1 : a.downvotes,
                        };
                    }
                    // Recurse into follow-ups
                    if (a.followUps?.length > 0) {
                        return { ...a, followUps: findAndUpdate(a.followUps) };
                    }
                    return a;
                });

                return { ...q, answers: updatedAnswers };
            });
        };
        setQuestions(findAndUpdate);
    };

    const upvoteAnswer = (questionId: string, answerId: string) => updateVotes(questionId, answerId, 'up');
    const downvoteAnswer = (questionId: string, answerId: string) => updateVotes(questionId, answerId, 'down');

    const getChatMessages = (conversationId: string) => chatMessages.filter(m => m.conversationId === conversationId);

    const sendChatMessage = (conversationId: string, content: string, attachments: any[]) => {
        if (!currentUser) return;
        const isRemembering = getRememberState(conversationId);
        const newMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            conversationId,
            senderId: currentUser.id,
            content,
            timestamp: new Date().toISOString(),
            remembered: isRemembering,
            attachments,
        };
        setChatMessages(prev => [...prev, newMessage]);

        if (isRemembering && content.trim()) {
             addEntry({
                text: content,
                contributor: currentUser.name,
                date: new Date().toISOString().split("T")[0],
                type: 'message',
            });
        }
    };
    
    const getRememberState = (conversationId: string) => rememberStates[conversationId] ?? true;

    const toggleRememberState = (conversationId: string) => {
        setRememberStates(prev => ({
            ...prev,
            [conversationId]: !(prev[conversationId] ?? true)
        }));
    };

    const setCurrentUser = (user: Author) => {
        setCurrentUserInternal(user);
    };
    
    const updateUser = (updatedUser: Author) => {
        const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
        setUsers(updatedUsers);
        if (currentUser && currentUser.id === updatedUser.id) {
            setCurrentUser(updatedUser);
        }
    };

    const updateCreditBalance = (userId: string, amount: number) => {
        const updatedUsers = users.map(u => {
            if (u.id === userId) {
                const currentBalance = u.creditBalance ?? 0;
                return { ...u, creditBalance: Math.max(0, currentBalance + amount) };
            }
            return u;
        });
        setUsers(updatedUsers);
        if (currentUser && currentUser.id === userId) {
            const updatedCurrentUser = updatedUsers.find(u => u.id === userId);
            if (updatedCurrentUser) {
                setCurrentUser(updatedCurrentUser);
            }
        }
    };

    const getChatHistoryItem = (chatId: string) => chatHistory.find(item => item.id === chatId);

    const addHistoryItem = (title: string, messages: Message[], sources: any[] = []): ChatHistoryItem => {
        if (!currentUser) throw new Error("No current user");
        const newItem: ChatHistoryItem = {
            id: `chat-${Date.now()}`,
            userId: currentUser.id,
            title,
            date: new Date().toISOString(),
            messages,
            sources,
        };
        setChatHistory(prev => [newItem, ...prev]);
        return newItem;
    };

    const addMessageToHistory = (chatId: string, message: Message, sources?: any[]) => {
        setChatHistory(prev => prev.map(item => {
            if (item.id === chatId) {
                const newMessages = [...item.messages, message];
                let newSources = item.sources;
                if (sources && message.sender === 'ai') {
                    newSources = sources;
                }
                 // If this is the second message in a new chat, update the title
                if (item.messages.length === 1 && item.messages[0].sender === 'user') {
                     return { ...item, messages: newMessages, sources: newSources, title: item.messages[0].text };
                }
                return { ...item, messages: newMessages, sources: newSources };
            }
            return item;
        }));
    };

    if (!isReady || !currentUser) {
        return (
            <div className="flex h-screen w-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <InformationContext.Provider value={{
            entries, addEntry,
            summaries, refreshSummaries,
            questions, addQuestion, addAnswer, addFollowUp, getQuestionById, upvoteAnswer, downvoteAnswer,
            chatMessages, getChatMessages, sendChatMessage, rememberStates, getRememberState, toggleRememberState,
            chatHistory, addHistoryItem, addMessageToHistory, getChatHistoryItem,
            users, currentUser, setCurrentUser, updateUser, updateCreditBalance,
            isReady
        }}>
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
