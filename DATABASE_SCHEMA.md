# Memora AI - Firestore Database Schema

## Overview

This document defines the Firestore database structure for Memora AI. All data is scoped to **spaces** - isolated knowledge containers that users can join.

---

## Collection Structure

```
/users/{userId}
/spaces/{spaceId}
/spaces/{spaceId}/members/{userId}
/spaces/{spaceId}/entries/{entryId}
/spaces/{spaceId}/summaries/{summaryId}
/spaces/{spaceId}/questions/{questionId}
/spaces/{spaceId}/conversations/{conversationId}
/spaces/{spaceId}/conversations/{conversationId}/messages/{messageId}
```

---

## Detailed Schema

### `/users/{userId}`

User's global profile and space memberships.

```typescript
{
  // Document ID: Firebase Auth UID
  email: string;                    // From Google Auth
  firstName: string;                // Collected during onboarding
  lastName: string;                 // Collected during onboarding
  createdAt: Timestamp;             // Account creation date
  spaces: string[];                 // Array of spaceIds user belongs to
}
```

**Example:**
```json
{
  "email": "student@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "createdAt": "2024-01-15T10:30:00Z",
  "spaces": ["1234567", "7654321"]
}
```

---

### `/spaces/{spaceId}`

Space definition and configuration.

```typescript
{
  // Document ID: 7-digit unique number (e.g., "1234567")
  spaceId: string;                  // Same as document ID
  name: string;                     // Display name (e.g., "GRIET")
  type: string;                     // Space type: "college" | "company" | "community"
  createdAt: Timestamp;             // Space creation date
  settings: {
    yearOptions: string[];          // Options for year field
    branchOptions: string[];        // Options for branch/department field
    // Additional settings can be added per space type
  }
}
```

**Example (College Space):**
```json
{
  "spaceId": "1234567",
  "name": "Gokaraju Rangaraju Institute of Engineering and Technology",
  "type": "college",
  "createdAt": "2024-01-01T00:00:00Z",
  "settings": {
    "yearOptions": [
      "1st Year",
      "2nd Year",
      "3rd Year",
      "4th Year",
      "Graduated"
    ],
    "branchOptions": [
      "Computer Science and Engineering",
      "Computer Science and Engineering (AIML)",
      "Computer Science and Engineering (DS)",
      "Computer Science and Business Systems",
      "Electronics and Communication Engineering",
      "Electronics and Electrical Engineering",
      "Mechanical Engineering",
      "Civil Engineering"
    ]
  }
}
```

---

### `/spaces/{spaceId}/members/{userId}`

User's membership and profile within a specific space.

```typescript
{
  // Document ID: Firebase Auth UID
  joinedAt: Timestamp;              // When user joined this space
  role: string;                     // "member" | "admin"
  profile: {
    year: string;                   // From space settings.yearOptions
    branch: string;                 // From space settings.branchOptions (called "department" in UI)
    clubs: Array<{
      id: string;
      name: string;
      position: string;
    }>;
    workExperience: Array<{
      id: string;
      organization: string;
      employmentType: "intern" | "full-time";
      position: string;
      startDate: string;            // Format: DDMMYYYY
      endDate: string;              // Format: DDMMYYYY
    }>;
    creditBalance: number;          // User's credits in this space
  }
}
```

**Example:**
```json
{
  "joinedAt": "2024-01-15T10:30:00Z",
  "role": "member",
  "profile": {
    "year": "2nd Year",
    "branch": "Computer Science and Engineering",
    "clubs": [
      {
        "id": "club-1705312200000",
        "name": "Coding Club",
        "position": "Member"
      }
    ],
    "workExperience": [
      {
        "id": "work-1705312200000",
        "organization": "Tech Corp",
        "employmentType": "intern",
        "position": "Software Intern",
        "startDate": "01062024",
        "endDate": "31082024"
      }
    ],
    "creditBalance": 100
  }
}
```

---

### `/spaces/{spaceId}/entries/{entryId}`

Knowledge entries from all tabs (Add, Help, Chat).

```typescript
{
  // Document ID: Auto-generated
  entryId: string;                  // Same as document ID
  sourceType: string;               // "manual" | "help" | "chat"
  content: string;                  // The actual content/text
  createdBy: string;                // userId who created it
  createdAt: Timestamp;             // Creation timestamp
  contributor: string;              // Display name or "Anonymous"
  status: string;                   // "success" | "adjusted" | "mismatch"
  metadata: {
    // For "help" entries:
    questionId?: string;            // Reference to question
    answerId?: string;              // Reference to answer

    // For "chat" entries:
    conversationId?: string;        // Reference to conversation
    messageIndex?: number;          // Position in conversation

    // For "manual" entries:
    userTags?: string[];            // User-provided tags

    // For multimedia:
    attachments?: Array<{
      type: "image" | "file";
      url: string;
      name: string;
    }>;
  }
}
```

**Example (Manual Entry from Add Tab):**
```json
{
  "entryId": "abc123",
  "sourceType": "manual",
  "content": "The campus library is open 24/7 during exam season...",
  "createdBy": "user123",
  "createdAt": "2024-01-15T14:30:00Z",
  "contributor": "John D.",
  "status": "success",
  "metadata": {
    "userTags": ["library", "exams", "campus"]
  }
}
```

**Example (Help Entry from Answer):**
```json
{
  "entryId": "def456",
  "sourceType": "help",
  "content": "You can find the syllabus on the university portal...",
  "createdBy": "user456",
  "createdAt": "2024-01-15T15:00:00Z",
  "contributor": "Jane S.",
  "status": "success",
  "metadata": {
    "questionId": "q-789",
    "answerId": "a-101"
  }
}
```

---

### `/spaces/{spaceId}/summaries/{summaryId}`

AI-generated summaries with topic-level source tracking.

```typescript
{
  // Document ID: Format "domain_subtopic" (sanitized)
  summaryId: string;                // Same as document ID
  domain: string;                   // High-level category
  subtopic: string;                 // Specific topic within domain
  content: string;                  // AI-generated summary text
  topicSources: {                   // Map of topic -> contributing entry IDs
    [topicKey: string]: string[];   // e.g., "library_hours": ["entry1", "entry2"]
  };
  allContributingEntries: string[]; // All entry IDs that contributed
  entryCount: number;               // Number of entries processed
  version: number;                  // Incremented on each update
  createdAt: Timestamp;             // Initial creation
  lastUpdated: Timestamp;           // Last modification
}
```

**Example:**
```json
{
  "summaryId": "campus_facilities_library",
  "domain": "Campus Facilities",
  "subtopic": "Library",
  "content": "The campus library offers 24/7 access during exams, has multiple study rooms, and provides online resources...",
  "topicSources": {
    "operating_hours": ["entry1", "entry5"],
    "study_rooms": ["entry2", "entry3"],
    "online_resources": ["entry4"]
  },
  "allContributingEntries": ["entry1", "entry2", "entry3", "entry4", "entry5"],
  "entryCount": 5,
  "version": 3,
  "createdAt": "2024-01-10T10:00:00Z",
  "lastUpdated": "2024-01-15T14:30:00Z"
}
```

---

### `/spaces/{spaceId}/questions/{questionId}`

Questions for the Help tab (Q&A system).

```typescript
{
  // Document ID: Auto-generated
  questionId: string;               // Same as document ID
  question: string;                 // The question text
  askedBy: string;                  // userId
  askedByName: string;              // Display name for quick access
  createdAt: Timestamp;             // When asked
  relevance: string;                // "high" | "medium" | "low"
  answerCount: number;              // Number of answers
  isFollowUp: boolean;              // Is this a follow-up question?
  parentAnswerId?: string;          // If follow-up, which answer it follows
  parentQuestionId?: string;        // If follow-up, the root question

  // Denormalized answers for quick display (or use subcollection)
  answers: Array<{
    id: string;
    text: string;
    authorId: string;
    authorName: string;
    upvotes: number;
    downvotes: number;
    createdAt: Timestamp;
    followUpCount: number;
  }>;
}
```

**Example:**
```json
{
  "questionId": "q-abc123",
  "question": "What are the library hours during exam week?",
  "askedBy": "user123",
  "askedByName": "John D.",
  "createdAt": "2024-01-15T10:00:00Z",
  "relevance": "high",
  "answerCount": 2,
  "isFollowUp": false,
  "answers": [
    {
      "id": "a-def456",
      "text": "The library is open 24/7 during exam week.",
      "authorId": "user456",
      "authorName": "Jane S.",
      "upvotes": 5,
      "downvotes": 0,
      "createdAt": "2024-01-15T10:30:00Z",
      "followUpCount": 1
    }
  ]
}
```

---

### `/spaces/{spaceId}/conversations/{conversationId}`

Direct message conversations for Chat tab.

```typescript
{
  // Document ID: Deterministic format [userId1, userId2].sort().join('-')
  conversationId: string;           // Same as document ID
  participants: string[];           // Array of 2 userIds
  participantNames: {               // Map for quick name lookup
    [userId: string]: string;
  };
  createdAt: Timestamp;             // First message time
  updatedAt: Timestamp;             // Last message time
  lastMessage: {                    // Preview for list view
    content: string;
    senderId: string;
    timestamp: Timestamp;
  };
}
```

**Example:**
```json
{
  "conversationId": "user123-user456",
  "participants": ["user123", "user456"],
  "participantNames": {
    "user123": "John D.",
    "user456": "Jane S."
  },
  "createdAt": "2024-01-10T10:00:00Z",
  "updatedAt": "2024-01-15T14:30:00Z",
  "lastMessage": {
    "content": "Thanks for the help!",
    "senderId": "user123",
    "timestamp": "2024-01-15T14:30:00Z"
  }
}
```

---

### `/spaces/{spaceId}/conversations/{conversationId}/messages/{messageId}`

Individual messages within a conversation.

```typescript
{
  // Document ID: Auto-generated
  messageId: string;                // Same as document ID
  conversationId: string;           // Parent conversation
  senderId: string;                 // userId who sent
  content: string;                  // Message text
  timestamp: Timestamp;             // When sent
  remembered: boolean;              // If saved to entries
  attachments?: Array<{
    type: "image" | "file";
    url: string;
    name: string;
  }>;
}
```

---

### `/spaces/{spaceId}/chatHistory/{chatId}` (Ask Tab History)

Conversation history with AI for Ask tab.

```typescript
{
  // Document ID: Auto-generated
  chatId: string;                   // Same as document ID
  userId: string;                   // Who created this chat
  title: string;                    // First question or AI-generated title
  createdAt: Timestamp;             // When started
  updatedAt: Timestamp;             // Last message
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Timestamp;
    sourcesUsed?: {                 // For assistant messages
      summaries: string[];
      topicsReferenced: {
        [summaryId: string]: string[];
      };
      originalEntries: string[];
    };
    confidence?: number;            // AI confidence score
  }>;
}
```

---

## Indexes Required

```
// For querying entries by source type
spaces/{spaceId}/entries: (sourceType ASC, createdAt DESC)

// For querying questions by date
spaces/{spaceId}/questions: (createdAt DESC)

// For querying conversations by participant
spaces/{spaceId}/conversations: (participants ARRAY_CONTAINS, updatedAt DESC)

// For querying chat history by user
spaces/{spaceId}/chatHistory: (userId ASC, updatedAt DESC)
```

---

## Security Rules Summary

```javascript
// Users can only access their own user document
/users/{userId}: auth.uid == userId

// Anyone authenticated can read space metadata
/spaces/{spaceId}: auth != null (read)
/spaces/{spaceId}: isMember(spaceId) (write)

// Only space members can access space data
/spaces/{spaceId}/**:  isMember(spaceId)

// Helper function
function isMember(spaceId) {
  return exists(/databases/$(database)/documents/spaces/$(spaceId)/members/$(request.auth.uid));
}
```

---

## Migration Notes

### From localStorage to Firestore:

| localStorage Key | Firestore Location |
|------------------|-------------------|
| `memora-entries` | `/spaces/{spaceId}/entries/` |
| `memora-questions` | `/spaces/{spaceId}/questions/` |
| `memora-chat-messages` | `/spaces/{spaceId}/conversations/{id}/messages/` |
| `memora-chat-history` | `/spaces/{spaceId}/chatHistory/` |
| `memora-users` | `/users/` + `/spaces/{spaceId}/members/` |
| `memora-current-user` | Firebase Auth + `/users/{uid}` |
| `memora_summaries` | `/spaces/{spaceId}/summaries/` |
| `memora_raw_entries` | Merged into `/spaces/{spaceId}/entries/` |

### Key Changes:

1. **Space Scoping:** All data now lives under a space
2. **User Split:** Global user info in `/users/`, space-specific in `/members/`
3. **Conversations:** Restructured with subcollection for messages
4. **Summaries:** Moved from localStorage to Firestore (same structure)
5. **Credits:** Now per-space in member profile

---

## Initial Data

The first space to create:

```javascript
{
  spaceId: "1234567",
  name: "Gokaraju Rangaraju Institute of Engineering and Technology",
  type: "college",
  createdAt: serverTimestamp(),
  settings: {
    yearOptions: [
      "1st Year",
      "2nd Year",
      "3rd Year",
      "4th Year",
      "Graduated"
    ],
    branchOptions: [
      "Computer Science and Engineering",
      "Computer Science and Engineering (AIML)",
      "Computer Science and Engineering (DS)",
      "Computer Science and Business Systems",
      "Electronics and Communication Engineering",
      "Electronics and Electrical Engineering",
      "Mechanical Engineering",
      "Civil Engineering"
    ]
  }
}
```
