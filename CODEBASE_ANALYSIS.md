# Memora AI - Codebase Analysis

## Project Overview

**Memora AI** is a knowledge management platform built with modern web technologies. This analysis was created as part of Phase 1 of the Firebase migration.

---

## 1. Project Framework & Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.5.9 | Full-stack React framework (App Router) |
| **React** | 19.2.1 | UI library |
| **TypeScript** | - | Type safety |
| **TailwindCSS** | - | Styling |
| **Radix UI** | - | Component library |
| **Genkit** | 1.20.0 | AI orchestration |
| **Google Gemini** | gemini-2.5-flash | AI model |
| **Firebase** | 11.9.1 | Backend (partially set up) |
| **React Hook Form** | 7.54.2 | Form handling |
| **Zod** | - | Schema validation |

---

## 2. Folder Structure

```
memora/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth routes (login, onboarding)
│   │   │   ├── login/page.tsx
│   │   │   └── onboarding/page.tsx
│   │   ├── (main)/                   # Main app routes
│   │   │   ├── add/page.tsx          # Add tab
│   │   │   ├── ask/page.tsx          # Ask tab
│   │   │   ├── chat/page.tsx         # Chat tab
│   │   │   ├── help/page.tsx         # Help tab
│   │   │   ├── space/page.tsx        # Space tab
│   │   │   ├── people/page.tsx       # People tab
│   │   │   ├── profile/page.tsx      # Profile tab
│   │   │   └── layout.tsx            # Main layout with sidebar
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Home (redirects)
│   │
│   ├── components/                   # React Components
│   │   ├── add/
│   │   │   └── add-client.tsx        # Add tab client component
│   │   ├── ask/
│   │   │   ├── ask-client.tsx        # Ask tab client component
│   │   │   └── chat-interface.tsx    # AI chat interface
│   │   ├── chat/
│   │   │   └── chat-client.tsx       # Chat tab client component
│   │   ├── help/
│   │   │   └── help-client.tsx       # Help tab client component
│   │   ├── space/
│   │   │   └── space-client.tsx      # Space tab client component
│   │   ├── layout/
│   │   │   ├── main-layout.tsx       # Main layout wrapper
│   │   │   └── main-sidebar.tsx      # Sidebar navigation
│   │   └── ui/                       # Reusable UI components (Radix-based)
│   │
│   ├── context/
│   │   └── information-context.tsx   # Main state management (React Context)
│   │
│   ├── ai/                           # AI/Genkit Flows
│   │   ├── genkit.ts                 # Genkit configuration
│   │   └── flows/
│   │       ├── summarize-user-information.ts
│   │       ├── process-multimedia-input.ts
│   │       ├── extract-topics.ts
│   │       ├── update-summary.ts
│   │       ├── query-with-sources.ts
│   │       └── answer-user-queries-with-sources.ts
│   │
│   ├── services/                     # Business Logic
│   │   ├── storage.ts                # localStorage operations for topic tracking
│   │   ├── entry-processor.ts        # Entry processing & topic extraction
│   │   └── query-handler.ts          # Query handling with source attribution
│   │
│   ├── firebase/                     # Firebase Setup
│   │   ├── config.ts                 # Firebase config
│   │   ├── index.ts                  # Firebase initialization
│   │   ├── provider.tsx              # Firebase React context
│   │   └── client-provider.tsx       # Client-side Firebase init
│   │
│   ├── hooks/                        # Custom React Hooks
│   │   └── use-mobile.tsx            # Mobile detection hook
│   │
│   └── lib/                          # Utilities
│       └── utils.ts                  # Helper functions
│
├── public/                           # Static assets
├── .env                              # Environment variables
├── next.config.ts                    # Next.js config
├── tailwind.config.ts                # Tailwind config
├── tsconfig.json                     # TypeScript config
└── package.json                      # Dependencies
```

---

## 3. How Each Tab Works

### ADD Tab (`/add`)
**File:** `src/components/add/add-client.tsx`

**Purpose:** Users contribute knowledge/information to the platform.

**Features:**
- Two views: "New Chat" (add new entry) and "History" (view past contributions)
- Supports text input, image upload, file upload, voice recording
- Anonymous contribution toggle
- AI-powered summarization
- Topic-level source tracking (extracts domain/subtopic/topics)
- Credit system: +10 credits per contribution

**Data Flow:**
1. User inputs text or uploads media
2. AI summarizes content via `summarizeUserInformation()` flow
3. Entry saved to context state → localStorage
4. Background: `processNewEntry()` extracts topics
5. Summary created/updated in localStorage

---

### HELP Tab (`/help`)
**File:** `src/components/help/help-client.tsx`

**Purpose:** Community Q&A system.

**Views:**
- `open-queries`: Browse unanswered questions
- `your-queries`: User's own questions
- `your-responses`: Answers user has provided
- `question-detail`: View specific question thread
- `post-question`: Create new question
- `answer-question`: Respond to a question
- `follow-up-question`: Add follow-up

**Data Flow:**
- Questions stored in context as array
- Answers nested inside questions
- Follow-ups nested inside answers
- Navigation via URL search params: `/help?view=<view>&id=<id>`

---

### CHAT Tab (`/chat`)
**File:** `src/components/chat/chat-client.tsx`

**Purpose:** Direct messaging between users.

**Features:**
- User list view with last message preview
- 1-to-1 conversation threads
- Sorted by most recent message

**Data Flow:**
- Messages stored in context
- Conversation ID: `[userId1, userId2].sort().join('-')`
- Navigation: `/chat?userId=<userId>`

---

### ASK Tab (`/ask`)
**Files:**
- `src/components/ask/ask-client.tsx`
- `src/components/ask/chat-interface.tsx`

**Purpose:** AI-powered Q&A with source attribution.

**Views:**
- `new-chat`: Start new conversation
- `history`: Browse past conversations
- `chat-detail`: View conversation
- `sources`: View sources for an answer

**Features:**
- Credit system: -1 credit per question
- Topic-level source tracking
- Shows which summaries and topics were used
- Displays original entry details

**Data Flow:**
1. User asks question (-1 credit)
2. System finds relevant summaries via keyword matching
3. AI answers via `queryWithSources()` flow
4. Returns answer + source attribution
5. Conversation saved to history

---

### SPACE Tab (`/space`)
**File:** `src/components/space/space-client.tsx`

**Purpose:** User profile management.

**Editable Fields:**
- Year (e.g., "2nd Year")
- Department (e.g., "Computer Science")
- Clubs (array: name, position)
- Work Experience (array: organization, type, position, dates)
- Credit Balance (display only)

**Data Flow:**
- Profile data in `currentUser` from context
- Save updates context + localStorage

---

## 4. Current Data Flow

```
┌─────────────────┐
│   User Input    │
│   (Add Tab)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  AI Processing  │
│ (Genkit Flows)  │
│ - Summarize     │
│ - Extract Topics│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ React Context   │
│ (State Update)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  localStorage   │
│  (Persistence)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Ask Tab       │
│ (Query System)  │
│ - Find Summaries│
│ - AI Answer     │
│ - Source Attrib │
└─────────────────┘
```

---

## 5. localStorage Keys & Data Schemas

### Information Context Keys (`src/context/information-context.tsx`)

| Key | Type | Description |
|-----|------|-------------|
| `memora-entries` | `Entry[]` | All entries (add, help, messages) |
| `memora-questions` | `Question[]` | Q&A questions with nested answers |
| `memora-chat-messages` | `ChatMessage[]` | Direct messages |
| `memora-chat-history` | `ChatHistoryItem[]` | Ask tab conversation history |
| `memora-users` | `Author[]` | All users |
| `memora-current-user` | `Author` | Current logged-in user |
| `memora-remember-states` | `Record<string, boolean>` | Remember toggle states |

### Topic-Level Source Tracking Keys (`src/services/storage.ts`)

| Key | Type | Description |
|-----|------|-------------|
| `memora_raw_entries` | `Record<string, RawEntry>` | Raw entries for topic tracking |
| `memora_summaries` | `Record<string, Summary>` | AI-generated summaries by domain |
| `memora_query_history` | `QueryResponse[]` | Query history with sources |
| `memora_domains` | `string[]` | List of all domains |

### Data Schemas

**Entry:**
```typescript
interface Entry {
  id: string;
  userId: string;
  text: string;
  contributor: string;
  date: string; // ISO date
  type: 'add' | 'help' | 'message' | 'question' | 'answer' | 'follow-up';
  status?: 'success' | 'adjusted' | 'mismatch';
  question?: string;
  questionId?: string;
}
```

**RawEntry (Topic Tracking):**
```typescript
interface RawEntry {
  entry_id: string;
  source_type: 'manual' | 'help' | 'chat';
  content: string;
  timestamp: string;
  metadata: {
    original_question_id?: string;
    conversation_id?: string;
    message_index?: number;
    user_tags?: string[];
  };
}
```

**Summary:**
```typescript
interface Summary {
  summary_id: string;
  domain: string;
  subtopic: string;
  content: string;
  topic_sources: Record<string, string[]>; // topic_key -> entry_ids
  all_contributing_entries: string[];
  entry_count: number;
  version: number;
  created_at: string;
  last_updated: string;
}
```

**Question:**
```typescript
interface Question {
  id: string;
  question: string;
  author: Author;
  answers: Answer[];
  relevance: 'high' | 'medium' | 'low';
  isFollowUp?: boolean;
  parentId?: string;
}
```

**Answer:**
```typescript
interface Answer {
  id: string;
  text: string;
  author: Author;
  upvotes: number;
  downvotes: number;
  followUps: Question[];
}
```

**ChatMessage:**
```typescript
interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: string;
  remembered: boolean;
  attachments?: { type: 'image' | 'file', url: string, name: string }[];
}
```

**Author (User Profile):**
```typescript
interface Author {
  id: string;
  name: string;
  year: string;
  department: string;
  clubs: Club[];
  workExperience: WorkExperience[];
  creditBalance: number;
}
```

---

## 6. Existing Firebase Setup

**Status:** Partially configured but not actively used.

**Config File:** `src/firebase/config.ts`
```typescript
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
};
```

**Current Project ID:** `studio-7680548045-10799` (This is a Firebase Studio project)

**Services Initialized:**
- Firebase App
- Firebase Auth
- Firestore (imported but not used)

**Providers:**
- `FirebaseClientProvider` - Initializes Firebase on client mount
- `FirebaseProvider` - Provides Firebase context and auth state

**Current Auth Mode:** Disabled/Mock mode (authentication logic commented out)

**Note:** The current Firebase project (`studio-7680548045-10799`) is different from the target project (`memora-001`). We will need to update the configuration.

---

## 7. Gemini API Integration Pattern

**Genkit Configuration:** `src/ai/genkit.ts`
```typescript
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-2.5-flash',
});
```

**API Key Location:** `.env` file as `GEMINI_API_KEY`

**Current API Key:** `AIzaSyBVv90sx1TbAsv1AuQ_o_1mC2x4KQARNlY`

**AI Flows (Server Actions):**

| Flow | File | Purpose |
|------|------|---------|
| `summarizeUserInformation` | `summarize-user-information.ts` | Summarize text input |
| `processMultimediaInput` | `process-multimedia-input.ts` | Process images/files |
| `extractTopicsFromEntry` | `extract-topics.ts` | Extract domain/subtopic/topics |
| `updateSummaryWithEntry` | `update-summary.ts` | Update existing summary |
| `createNewSummary` | `update-summary.ts` | Create new summary |
| `queryWithSources` | `query-with-sources.ts` | Answer with source attribution |
| `answerUserQuery` | `answer-user-queries-with-sources.ts` | Legacy query answer |

**Execution:** All flows run server-side via Next.js server actions (`'use server'` directive).

**IMPORTANT:** Currently, the Gemini API key is exposed in client-side code (via Next.js server actions that can be inspected). Moving to Firebase Cloud Functions will secure the API key.

---

## 8. State Management Approach

**Pattern:** React Context API

**Main Context:** `InformationContext` (`src/context/information-context.tsx`)

**Key States:**
- `entries` - All knowledge entries
- `questions` - Q&A questions
- `chatMessages` - Direct messages
- `chatHistory` - Ask tab conversations
- `users` - All users
- `currentUser` - Logged-in user
- `rememberStates` - Remember toggles
- `isReady` - Loading state

**Persistence:**
- All state is persisted to localStorage via `useEffect` hooks
- Data loaded from localStorage on initial mount
- Changes automatically saved when state updates

**Provider Location:** Wraps entire app in `src/app/layout.tsx`

---

## 9. Routing Structure

**Framework:** Next.js App Router

**Route Groups:**
- `(auth)` - Authentication routes
- `(main)` - Main application routes

**Main Routes:**

| Path | Component | Tab |
|------|-----------|-----|
| `/ask` | `AskClient` | Ask |
| `/add` | `AddClient` | Add |
| `/help` | `HelpClient` | Help |
| `/chat` | `ChatClient` | Chat |
| `/space` | `SpaceClient` | Space |
| `/people` | TBD | People |
| `/profile` | TBD | Profile |

**Navigation:**
- Sidebar uses Next.js `Link` components
- In-tab navigation uses URL search params (`router.push`)
- Pattern: `/tab?view=<view>&id=<id>&...`

---

## 10. Key Observations for Migration

### What Needs to Change:
1. **Firebase Project:** Switch from `studio-7680548045-10799` to `memora-001`
2. **Data Storage:** Move from localStorage to Firestore
3. **Authentication:** Implement Google Sign-In (currently disabled)
4. **Space Scoping:** Add space isolation to all data
5. **Gemini API:** Move to Cloud Functions (currently via Genkit server actions)

### What to Keep:
1. **Topic-Level Source Tracking:** Already implemented in `services/` and `ai/flows/`
2. **AI Flows:** Existing Genkit flows work well, just need to move server-side
3. **UI Components:** All tabs work, just need data layer changes
4. **State Structure:** Context patterns can be adapted for Firestore

### Notable Implementation Details:
- Credit system already exists (+10 for add, -1 for ask)
- Entry status tracking exists ('success', 'adjusted', 'mismatch')
- Anonymous contributions supported
- Remember toggle for conversations
- Confidence scoring on AI responses

---

## Summary

The Memora codebase is well-structured with clear separation of concerns. The main migration work involves:
1. Setting up proper Firebase authentication
2. Creating Firestore database with space scoping
3. Migrating localStorage operations to Firestore
4. Moving Gemini API calls to secure Cloud Functions
5. Adding the space management UI

The topic-level source tracking system is already fully implemented and should be preserved during migration.
