/**
 * @fileOverview Firestore service layer for Memora AI
 * All data operations are scoped to spaces
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  increment,
  Firestore,
} from 'firebase/firestore';

// ============ TYPES ============

export interface FirestoreEntry {
  entryId?: string;
  sourceType: 'manual' | 'help' | 'chat';
  content: string;
  createdBy: string;
  createdAt?: Timestamp;
  contributor: string;
  status?: 'success' | 'adjusted' | 'mismatch';
  metadata?: {
    questionId?: string;
    answerId?: string;
    conversationId?: string;
    messageIndex?: number;
    userTags?: string[];
    attachments?: Array<{
      type: 'image' | 'file';
      url: string;
      name: string;
    }>;
  };
}

export interface FirestoreQuestion {
  questionId?: string;
  question: string;
  askedBy: string;
  askedByName: string;
  createdAt?: Timestamp;
  relevance: 'high' | 'medium' | 'low';
  answerCount: number;
  isFollowUp: boolean;
  parentAnswerId?: string;
  parentQuestionId?: string;
  answers: FirestoreAnswer[];
}

export interface FirestoreAnswer {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  upvotes: number;
  downvotes: number;
  createdAt?: Timestamp;
  followUpCount: number;
}

export interface FirestoreSummary {
  summaryId?: string;
  domain: string;
  subtopic: string;
  content: string;
  topicSources: Record<string, string[]>;
  allContributingEntries: string[];
  entryCount: number;
  version: number;
  createdAt?: Timestamp;
  lastUpdated?: Timestamp;
}

export interface FirestoreConversation {
  conversationId?: string;
  participants: string[];
  participantNames: Record<string, string>;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  lastMessage?: {
    content: string;
    senderId: string;
    timestamp: Timestamp;
  };
}

export interface FirestoreChatMessage {
  messageId?: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp?: Timestamp;
  remembered: boolean;
  attachments?: Array<{
    type: 'image' | 'file';
    url: string;
    name: string;
  }>;
}

export interface FirestoreChatHistory {
  chatId?: string;
  userId: string;
  title: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    sourcesUsed?: {
      summaries: string[];
      topicsReferenced: Record<string, string[]>;
      originalEntries: string[];
    };
    confidence?: number;
  }>;
}

// ============ ENTRIES ============

/**
 * Save an entry to the current space
 */
export async function saveEntry(
  firestore: Firestore,
  spaceId: string,
  entryData: FirestoreEntry
): Promise<FirestoreEntry & { entryId: string }> {
  const entriesRef = collection(firestore, 'spaces', spaceId, 'entries');

  const entry = {
    ...entryData,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(entriesRef, entry);

  // Return with a placeholder timestamp since serverTimestamp() hasn't resolved yet
  return {
    ...entryData,
    entryId: docRef.id,
    createdAt: Timestamp.now(),
  };
}

/**
 * Get all entries for a space
 */
export async function getEntries(
  firestore: Firestore,
  spaceId: string,
  options: { sourceType?: string; limitCount?: number } = {}
): Promise<Array<FirestoreEntry & { entryId: string }>> {
  const entriesRef = collection(firestore, 'spaces', spaceId, 'entries');

  let q = query(entriesRef, orderBy('createdAt', 'desc'));

  if (options.sourceType) {
    q = query(entriesRef, where('sourceType', '==', options.sourceType), orderBy('createdAt', 'desc'));
  }

  if (options.limitCount) {
    q = query(q, limit(options.limitCount));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ entryId: doc.id, ...doc.data() } as FirestoreEntry & { entryId: string }));
}

/**
 * Get a single entry
 */
export async function getEntry(
  firestore: Firestore,
  spaceId: string,
  entryId: string
): Promise<(FirestoreEntry & { entryId: string }) | null> {
  const docRef = doc(firestore, 'spaces', spaceId, 'entries', entryId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { entryId: docSnap.id, ...docSnap.data() } as FirestoreEntry & { entryId: string };
  }
  return null;
}

/**
 * Get multiple entries by IDs
 */
export async function getEntriesByIds(
  firestore: Firestore,
  spaceId: string,
  entryIds: string[]
): Promise<Array<FirestoreEntry & { entryId: string }>> {
  const entries = await Promise.all(entryIds.map((id) => getEntry(firestore, spaceId, id)));
  return entries.filter((e): e is FirestoreEntry & { entryId: string } => e !== null);
}

// ============ QUESTIONS (for Help tab) ============

/**
 * Save a question
 */
export async function saveQuestion(
  firestore: Firestore,
  spaceId: string,
  questionData: Omit<FirestoreQuestion, 'questionId' | 'createdAt' | 'answerCount' | 'answers'>
): Promise<FirestoreQuestion & { questionId: string }> {
  const questionsRef = collection(firestore, 'spaces', spaceId, 'questions');

  const question = {
    ...questionData,
    createdAt: serverTimestamp(),
    answerCount: 0,
    answers: [],
  };

  const docRef = await addDoc(questionsRef, question);

  return {
    ...questionData,
    questionId: docRef.id,
    createdAt: Timestamp.now(),
    answerCount: 0,
    answers: [],
  };
}

/**
 * Get questions for the Help tab
 */
export async function getQuestions(
  firestore: Firestore,
  spaceId: string,
  options: { limitCount?: number } = {}
): Promise<Array<FirestoreQuestion & { questionId: string }>> {
  const questionsRef = collection(firestore, 'spaces', spaceId, 'questions');

  let q = query(questionsRef, orderBy('createdAt', 'desc'));

  if (options.limitCount) {
    q = query(q, limit(options.limitCount));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ questionId: doc.id, ...doc.data() } as FirestoreQuestion & { questionId: string }));
}

/**
 * Get a single question
 */
export async function getQuestion(
  firestore: Firestore,
  spaceId: string,
  questionId: string
): Promise<(FirestoreQuestion & { questionId: string }) | null> {
  const docRef = doc(firestore, 'spaces', spaceId, 'questions', questionId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { questionId: docSnap.id, ...docSnap.data() } as FirestoreQuestion & { questionId: string };
  }
  return null;
}

/**
 * Add an answer to a question
 */
export async function addAnswerToQuestion(
  firestore: Firestore,
  spaceId: string,
  questionId: string,
  answer: FirestoreAnswer
): Promise<void> {
  const docRef = doc(firestore, 'spaces', spaceId, 'questions', questionId);

  const questionSnap = await getDoc(docRef);
  if (!questionSnap.exists()) {
    throw new Error('Question not found');
  }

  const question = questionSnap.data() as FirestoreQuestion;
  const updatedAnswers = [...(question.answers || []), answer];

  await updateDoc(docRef, {
    answers: updatedAnswers,
    answerCount: increment(1),
  });
}

/**
 * Update answer votes
 */
export async function updateAnswerVotes(
  firestore: Firestore,
  spaceId: string,
  questionId: string,
  answerId: string,
  voteType: 'up' | 'down'
): Promise<void> {
  const docRef = doc(firestore, 'spaces', spaceId, 'questions', questionId);
  const questionSnap = await getDoc(docRef);

  if (!questionSnap.exists()) return;

  const question = questionSnap.data() as FirestoreQuestion;
  const updatedAnswers = question.answers.map((a) => {
    if (a.id === answerId) {
      return {
        ...a,
        upvotes: voteType === 'up' ? a.upvotes + 1 : a.upvotes,
        downvotes: voteType === 'down' ? a.downvotes + 1 : a.downvotes,
      };
    }
    return a;
  });

  await updateDoc(docRef, { answers: updatedAnswers });
}

// ============ SUMMARIES (for Topic-Level Source Tracking) ============

/**
 * Get a summary by ID
 */
export async function getSummary(
  firestore: Firestore,
  spaceId: string,
  summaryId: string
): Promise<(FirestoreSummary & { summaryId: string }) | null> {
  const docRef = doc(firestore, 'spaces', spaceId, 'summaries', summaryId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { summaryId: docSnap.id, ...docSnap.data() } as FirestoreSummary & { summaryId: string };
  }
  return null;
}

/**
 * Save/update a summary
 */
export async function saveSummary(
  firestore: Firestore,
  spaceId: string,
  summaryId: string,
  summaryData: Omit<FirestoreSummary, 'summaryId' | 'lastUpdated'>
): Promise<FirestoreSummary & { summaryId: string }> {
  const docRef = doc(firestore, 'spaces', spaceId, 'summaries', summaryId);

  const data = {
    ...summaryData,
    lastUpdated: serverTimestamp(),
  };

  await setDoc(docRef, data, { merge: true });

  return {
    ...summaryData,
    summaryId,
    lastUpdated: Timestamp.now(),
  };
}

/**
 * Get all summaries for a space
 */
export async function getAllSummaries(
  firestore: Firestore,
  spaceId: string
): Promise<Array<FirestoreSummary & { summaryId: string }>> {
  const summariesRef = collection(firestore, 'spaces', spaceId, 'summaries');
  const snapshot = await getDocs(summariesRef);
  return snapshot.docs.map((doc) => ({ summaryId: doc.id, ...doc.data() } as FirestoreSummary & { summaryId: string }));
}

/**
 * Delete a summary
 */
export async function deleteSummary(
  firestore: Firestore,
  spaceId: string,
  summaryId: string
): Promise<void> {
  const docRef = doc(firestore, 'spaces', spaceId, 'summaries', summaryId);
  await deleteDoc(docRef);
}

// ============ CHAT HISTORY (for Ask tab) ============

/**
 * Save a new chat history item
 */
export async function saveChatHistory(
  firestore: Firestore,
  spaceId: string,
  chatData: Omit<FirestoreChatHistory, 'chatId' | 'createdAt' | 'updatedAt'>
): Promise<FirestoreChatHistory & { chatId: string }> {
  const chatRef = collection(firestore, 'spaces', spaceId, 'chatHistory');

  const chat = {
    ...chatData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(chatRef, chat);

  return {
    ...chatData,
    chatId: docRef.id,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
}

/**
 * Update a chat history item
 */
export async function updateChatHistory(
  firestore: Firestore,
  spaceId: string,
  chatId: string,
  updates: Partial<FirestoreChatHistory>
): Promise<void> {
  const docRef = doc(firestore, 'spaces', spaceId, 'chatHistory', chatId);

  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Get chat history for a user
 */
export async function getChatHistory(
  firestore: Firestore,
  spaceId: string,
  userId: string
): Promise<Array<FirestoreChatHistory & { chatId: string }>> {
  const chatRef = collection(firestore, 'spaces', spaceId, 'chatHistory');
  const q = query(chatRef, where('userId', '==', userId), orderBy('updatedAt', 'desc'));

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ chatId: doc.id, ...doc.data() } as FirestoreChatHistory & { chatId: string }));
}

/**
 * Get a single chat history item
 */
export async function getChatHistoryItem(
  firestore: Firestore,
  spaceId: string,
  chatId: string
): Promise<(FirestoreChatHistory & { chatId: string }) | null> {
  const docRef = doc(firestore, 'spaces', spaceId, 'chatHistory', chatId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { chatId: docSnap.id, ...docSnap.data() } as FirestoreChatHistory & { chatId: string };
  }
  return null;
}

// ============ CONVERSATIONS (for Chat tab) ============

/**
 * Get or create a conversation between two users
 */
export async function getOrCreateConversation(
  firestore: Firestore,
  spaceId: string,
  userId1: string,
  userId2: string,
  userName1: string,
  userName2: string
): Promise<FirestoreConversation & { conversationId: string }> {
  // Create deterministic conversation ID
  const participants = [userId1, userId2].sort();
  const conversationId = participants.join('-');

  const docRef = doc(firestore, 'spaces', spaceId, 'conversations', conversationId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { conversationId: docSnap.id, ...docSnap.data() } as FirestoreConversation & { conversationId: string };
  }

  // Create new conversation
  const conversation: FirestoreConversation = {
    participants,
    participantNames: {
      [userId1]: userName1,
      [userId2]: userName2,
    },
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
  };

  await setDoc(docRef, conversation);
  return { ...conversation, conversationId };
}

/**
 * Get all conversations for a user
 */
export async function getConversations(
  firestore: Firestore,
  spaceId: string,
  userId: string
): Promise<Array<FirestoreConversation & { conversationId: string }>> {
  const convoRef = collection(firestore, 'spaces', spaceId, 'conversations');
  const q = query(convoRef, where('participants', 'array-contains', userId), orderBy('updatedAt', 'desc'));

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ conversationId: doc.id, ...doc.data() } as FirestoreConversation & { conversationId: string }));
}

/**
 * Save a chat message
 */
export async function saveChatMessage(
  firestore: Firestore,
  spaceId: string,
  conversationId: string,
  messageData: Omit<FirestoreChatMessage, 'messageId' | 'timestamp'>
): Promise<FirestoreChatMessage & { messageId: string }> {
  const messagesRef = collection(
    firestore,
    'spaces',
    spaceId,
    'conversations',
    conversationId,
    'messages'
  );

  const message = {
    ...messageData,
    timestamp: serverTimestamp(),
  };

  const docRef = await addDoc(messagesRef, message);

  // Update conversation's updatedAt and lastMessage
  const convoRef = doc(firestore, 'spaces', spaceId, 'conversations', conversationId);
  await updateDoc(convoRef, {
    updatedAt: serverTimestamp(),
    lastMessage: {
      content: messageData.content,
      senderId: messageData.senderId,
      timestamp: serverTimestamp(),
    },
  });

  return {
    ...messageData,
    messageId: docRef.id,
    timestamp: Timestamp.now(),
  };
}

/**
 * Get messages for a conversation
 */
export async function getChatMessages(
  firestore: Firestore,
  spaceId: string,
  conversationId: string
): Promise<Array<FirestoreChatMessage & { messageId: string }>> {
  const messagesRef = collection(
    firestore,
    'spaces',
    spaceId,
    'conversations',
    conversationId,
    'messages'
  );
  const q = query(messagesRef, orderBy('timestamp', 'asc'));

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ messageId: doc.id, ...doc.data() } as FirestoreChatMessage & { messageId: string }));
}

// ============ SPACE MEMBERS ============

/**
 * Get all members of a space (for People tab)
 */
export async function getSpaceMembers(
  firestore: Firestore,
  spaceId: string
): Promise<Array<{
  odId: string;
  joinedAt: Timestamp;
  role: string;
  profile: {
    year: string;
    branch: string;
    clubs: Array<{ id: string; name: string; position: string }>;
    workExperience: Array<{
      id: string;
      organization: string;
      employmentType: string;
      position: string;
      startDate: string;
      endDate: string;
    }>;
    creditBalance: number;
  };
}>> {
  const membersRef = collection(firestore, 'spaces', spaceId, 'members');
  const snapshot = await getDocs(membersRef);
  return snapshot.docs.map((doc) => ({ odId: doc.id, ...doc.data() } as any));
}

// ============ UTILITY FUNCTIONS ============

/**
 * Find summaries relevant to a query using keyword matching
 */
export function findRelevantSummaries(
  summaries: Array<FirestoreSummary & { summaryId: string }>,
  queryText: string
): Array<FirestoreSummary & { summaryId: string }> {
  const queryWords = queryText.toLowerCase().split(/\s+/).filter((w) => w.length > 2);

  if (queryWords.length === 0) {
    return summaries;
  }

  const scored = summaries.map((summary) => {
    const searchText = `${summary.domain} ${summary.subtopic} ${summary.content} ${Object.keys(summary.topicSources).join(' ')}`.toLowerCase();

    let score = 0;
    for (const word of queryWords) {
      if (searchText.includes(word)) {
        score += 1;
        if (summary.domain.toLowerCase().includes(word) || summary.subtopic.toLowerCase().includes(word)) {
          score += 2;
        }
      }
    }

    return { summary, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((s) => s.summary);
}

/**
 * Generate UUID
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
