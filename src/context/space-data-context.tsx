'use client';

/**
 * @fileOverview SpaceDataContext - Manages space-scoped data from Firestore
 * Replaces localStorage-based data management with Firestore
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useFirebase } from '@/firebase';
import { useSpace } from '@/context/space-context';
import {
  FirestoreEntry,
  FirestoreQuestion,
  FirestoreSummary,
  FirestoreChatHistory,
  FirestoreAnswer,
  saveEntry,
  getEntries,
  saveQuestion,
  getQuestions,
  getQuestion,
  addAnswerToQuestion,
  updateAnswerVotes,
  getAllSummaries,
  saveSummary,
  getSummary as getFirestoreSummary,
  saveChatHistory,
  updateChatHistory,
  getChatHistory,
  getChatHistoryItem,
  generateUUID,
} from '@/services/firestore';

// ============ TYPES ============

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  showActions?: boolean;
}

export interface ChatHistoryItem {
  id: string;
  title: string;
  date: string;
  messages: Message[];
  sources: any[];
}

// Re-export Summary type for convenience
export type Summary = FirestoreSummary & { summaryId: string };

// ============ CONTEXT TYPE ============

interface SpaceDataContextType {
  // Entries
  entries: Array<FirestoreEntry & { entryId: string }>;
  addEntry: (entry: Omit<FirestoreEntry, 'entryId' | 'createdAt' | 'createdBy'>) => Promise<FirestoreEntry & { entryId: string }>;
  refreshEntries: () => Promise<void>;

  // Summaries (for topic-level source tracking)
  summaries: Summary[];
  refreshSummaries: () => Promise<void>;
  saveSummaryData: (summaryId: string, data: Omit<FirestoreSummary, 'summaryId' | 'lastUpdated'>) => Promise<Summary>;
  getSummaryById: (summaryId: string) => Promise<Summary | null>;

  // Questions (Help tab)
  questions: Array<FirestoreQuestion & { questionId: string }>;
  addQuestion: (questionText: string) => Promise<FirestoreQuestion & { questionId: string }>;
  addAnswer: (questionId: string, answerText: string, originalQuestion: string) => Promise<{ entryId: string } | void>;
  upvoteAnswer: (questionId: string, answerId: string) => Promise<void>;
  downvoteAnswer: (questionId: string, answerId: string) => Promise<void>;
  refreshQuestions: () => Promise<void>;
  getQuestionById: (questionId: string) => Promise<(FirestoreQuestion & { questionId: string }) | null>;

  // Chat History (Ask tab)
  chatHistory: ChatHistoryItem[];
  addHistoryItem: (title: string, messages: Message[], sources?: any[]) => Promise<ChatHistoryItem>;
  addMessageToHistory: (chatId: string, message: Message, sources?: any[]) => Promise<void>;
  getChatHistoryItemById: (chatId: string) => ChatHistoryItem | undefined;
  refreshChatHistory: () => Promise<void>;

  // Loading state
  isLoading: boolean;
  isReady: boolean;
}

// ============ CONTEXT ============

const SpaceDataContext = createContext<SpaceDataContextType | undefined>(undefined);

// ============ PROVIDER ============

interface SpaceDataProviderProps {
  children: ReactNode;
}

export function SpaceDataProvider({ children }: SpaceDataProviderProps) {
  const { user, firestore } = useFirebase();
  const { currentSpaceId, currentMembership, userProfile } = useSpace();

  const [entries, setEntries] = useState<Array<FirestoreEntry & { entryId: string }>>([]);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [questions, setQuestions] = useState<Array<FirestoreQuestion & { questionId: string }>>([]);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);

  // Get current user's display name
  const getCurrentUserName = useCallback(() => {
    if (userProfile?.firstName && userProfile?.lastName) {
      return `${userProfile.firstName} ${userProfile.lastName}`;
    }
    return user?.displayName || 'Anonymous';
  }, [userProfile, user]);

  // ============ LOAD DATA ============

  const loadAllData = useCallback(async () => {
    if (!currentSpaceId || !user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [entriesData, summariesData, questionsData, chatHistoryData] = await Promise.all([
        getEntries(firestore, currentSpaceId),
        getAllSummaries(firestore, currentSpaceId),
        getQuestions(firestore, currentSpaceId),
        getChatHistory(firestore, currentSpaceId, user.uid),
      ]);

      setEntries(entriesData);
      setSummaries(summariesData);
      setQuestions(questionsData);

      // Convert Firestore chat history to local format
      const formattedChatHistory: ChatHistoryItem[] = chatHistoryData.map((chat) => ({
        id: chat.chatId,
        title: chat.title,
        date: chat.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        messages: chat.messages.map((m) => ({
          id: m.id,
          text: m.content,
          sender: m.role === 'user' ? 'user' : 'ai',
          showActions: m.role === 'assistant',
        })),
        sources: [],
      }));
      setChatHistory(formattedChatHistory);

      setIsReady(true);
    } catch (error) {
      console.error('Error loading space data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentSpaceId, user, firestore]);

  // Load data when space changes
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // ============ ENTRIES ============

  const addEntryHandler = useCallback(async (
    entryData: Omit<FirestoreEntry, 'entryId' | 'createdAt' | 'createdBy'>
  ): Promise<FirestoreEntry & { entryId: string }> => {
    if (!currentSpaceId || !user) {
      throw new Error('No space or user');
    }

    const fullEntryData: FirestoreEntry = {
      ...entryData,
      createdBy: user.uid,
    };

    const newEntry = await saveEntry(firestore, currentSpaceId, fullEntryData);
    setEntries((prev) => [newEntry, ...prev]);
    return newEntry;
  }, [currentSpaceId, user, firestore]);

  const refreshEntries = useCallback(async () => {
    if (!currentSpaceId) return;
    const entriesData = await getEntries(firestore, currentSpaceId);
    setEntries(entriesData);
  }, [currentSpaceId, firestore]);

  // ============ SUMMARIES ============

  const refreshSummaries = useCallback(async () => {
    if (!currentSpaceId) return;
    const summariesData = await getAllSummaries(firestore, currentSpaceId);
    setSummaries(summariesData);
  }, [currentSpaceId, firestore]);

  const saveSummaryData = useCallback(async (
    summaryId: string,
    data: Omit<FirestoreSummary, 'summaryId' | 'lastUpdated'>
  ): Promise<Summary> => {
    if (!currentSpaceId) {
      throw new Error('No space');
    }
    const saved = await saveSummary(firestore, currentSpaceId, summaryId, data);
    await refreshSummaries();
    return saved;
  }, [currentSpaceId, firestore, refreshSummaries]);

  const getSummaryById = useCallback(async (summaryId: string): Promise<Summary | null> => {
    if (!currentSpaceId) return null;
    return await getFirestoreSummary(firestore, currentSpaceId, summaryId);
  }, [currentSpaceId, firestore]);

  // ============ QUESTIONS ============

  const addQuestionHandler = useCallback(async (
    questionText: string
  ): Promise<FirestoreQuestion & { questionId: string }> => {
    if (!currentSpaceId || !user) {
      throw new Error('No space or user');
    }

    const questionData = {
      question: questionText,
      askedBy: user.uid,
      askedByName: getCurrentUserName(),
      relevance: 'medium' as const,
      isFollowUp: false,
    };

    const newQuestion = await saveQuestion(firestore, currentSpaceId, questionData);
    setQuestions((prev) => [newQuestion, ...prev]);
    return newQuestion;
  }, [currentSpaceId, user, firestore, getCurrentUserName]);

  const addAnswerHandler = useCallback(async (
    questionId: string,
    answerText: string,
    originalQuestion: string
  ): Promise<{ entryId: string } | void> => {
    if (!currentSpaceId || !user) return;

    const answer: FirestoreAnswer = {
      id: `a-${generateUUID()}`,
      text: answerText,
      authorId: user.uid,
      authorName: getCurrentUserName(),
      upvotes: 0,
      downvotes: 0,
      followUpCount: 0,
    };

    await addAnswerToQuestion(firestore, currentSpaceId, questionId, answer);

    // Also save as an entry for knowledge base
    const savedEntry = await addEntryHandler({
      sourceType: 'help',
      content: `In response to "${originalQuestion}", the answer is: ${answerText}`,
      contributor: getCurrentUserName(),
      status: 'success',
      metadata: {
        questionId,
        answerId: answer.id,
      },
    });

    await refreshQuestions();

    // Return the entry ID so callers can use it for topic tracking
    return { entryId: savedEntry.entryId };
  }, [currentSpaceId, user, firestore, getCurrentUserName, addEntryHandler]);

  const upvoteAnswerHandler = useCallback(async (questionId: string, answerId: string) => {
    if (!currentSpaceId) return;
    await updateAnswerVotes(firestore, currentSpaceId, questionId, answerId, 'up');
    await refreshQuestions();
  }, [currentSpaceId, firestore]);

  const downvoteAnswerHandler = useCallback(async (questionId: string, answerId: string) => {
    if (!currentSpaceId) return;
    await updateAnswerVotes(firestore, currentSpaceId, questionId, answerId, 'down');
    await refreshQuestions();
  }, [currentSpaceId, firestore]);

  const refreshQuestions = useCallback(async () => {
    if (!currentSpaceId) return;
    const questionsData = await getQuestions(firestore, currentSpaceId);
    setQuestions(questionsData);
  }, [currentSpaceId, firestore]);

  const getQuestionByIdHandler = useCallback(async (
    questionId: string
  ): Promise<(FirestoreQuestion & { questionId: string }) | null> => {
    if (!currentSpaceId) return null;
    return await getQuestion(firestore, currentSpaceId, questionId);
  }, [currentSpaceId, firestore]);

  // ============ CHAT HISTORY ============

  const addHistoryItemHandler = useCallback(async (
    title: string,
    messages: Message[],
    sources: any[] = []
  ): Promise<ChatHistoryItem> => {
    if (!currentSpaceId || !user) {
      throw new Error('No space or user');
    }

    const chatData = {
      userId: user.uid,
      title,
      messages: messages.map((m) => ({
        id: m.id,
        role: m.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: m.text,
        timestamp: new Date().toISOString(),
      })),
    };

    const saved = await saveChatHistory(firestore, currentSpaceId, chatData);

    const newItem: ChatHistoryItem = {
      id: saved.chatId,
      title,
      date: new Date().toISOString(),
      messages,
      sources,
    };

    setChatHistory((prev) => [newItem, ...prev]);
    return newItem;
  }, [currentSpaceId, user, firestore]);

  const addMessageToHistoryHandler = useCallback(async (
    chatId: string,
    message: Message,
    sources?: any[]
  ): Promise<void> => {
    if (!currentSpaceId) return;

    // Find existing chat
    const existingChat = chatHistory.find((c) => c.id === chatId);
    if (!existingChat) return;

    const updatedMessages = [...existingChat.messages, message];

    // Update in Firestore
    await updateChatHistory(firestore, currentSpaceId, chatId, {
      messages: updatedMessages.map((m) => ({
        id: m.id,
        role: m.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: m.text,
        timestamp: new Date().toISOString(),
      })),
    });

    // Update local state
    setChatHistory((prev) =>
      prev.map((item) => {
        if (item.id === chatId) {
          // Update title if this is the second message (first was user's question)
          const newTitle = item.messages.length === 1 && item.messages[0].sender === 'user'
            ? item.messages[0].text
            : item.title;
          return {
            ...item,
            messages: updatedMessages,
            title: newTitle,
            sources: sources || item.sources,
          };
        }
        return item;
      })
    );
  }, [currentSpaceId, chatHistory, firestore]);

  const getChatHistoryItemByIdHandler = useCallback((chatId: string): ChatHistoryItem | undefined => {
    return chatHistory.find((item) => item.id === chatId);
  }, [chatHistory]);

  const refreshChatHistory = useCallback(async () => {
    if (!currentSpaceId || !user) return;
    const chatHistoryData = await getChatHistory(firestore, currentSpaceId, user.uid);
    const formattedChatHistory: ChatHistoryItem[] = chatHistoryData.map((chat) => ({
      id: chat.chatId,
      title: chat.title,
      date: chat.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      messages: chat.messages.map((m) => ({
        id: m.id,
        text: m.content,
        sender: m.role === 'user' ? 'user' : 'ai',
        showActions: m.role === 'assistant',
      })),
      sources: [],
    }));
    setChatHistory(formattedChatHistory);
  }, [currentSpaceId, user, firestore]);

  // ============ RENDER ============

  if (!isReady && isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <SpaceDataContext.Provider
      value={{
        entries,
        addEntry: addEntryHandler,
        refreshEntries,
        summaries,
        refreshSummaries,
        saveSummaryData,
        getSummaryById,
        questions,
        addQuestion: addQuestionHandler,
        addAnswer: addAnswerHandler,
        upvoteAnswer: upvoteAnswerHandler,
        downvoteAnswer: downvoteAnswerHandler,
        refreshQuestions,
        getQuestionById: getQuestionByIdHandler,
        chatHistory,
        addHistoryItem: addHistoryItemHandler,
        addMessageToHistory: addMessageToHistoryHandler,
        getChatHistoryItemById: getChatHistoryItemByIdHandler,
        refreshChatHistory,
        isLoading,
        isReady,
      }}
    >
      {children}
    </SpaceDataContext.Provider>
  );
}

// ============ HOOK ============

export function useSpaceData() {
  const context = useContext(SpaceDataContext);
  if (context === undefined) {
    throw new Error('useSpaceData must be used within a SpaceDataProvider');
  }
  return context;
}
