# Memora AI: The Self-Learning Information Base

Memora AI is an intelligent, collaborative knowledge base designed to answer questions *strictly* based on information it has learned from its users. It's a closed-loop system where the AI's knowledge grows and evolves entirely from user contributions, creating a trusted, single source of truth for any community or organization.

---

## How It Works: The Self-Learning Loop

Memora's intelligence is built on a simple yet powerful principle: it only knows what you teach it. The AI's knowledge base is dynamically built from three primary sources, creating a continuous learning loop.

1.  **📚 Direct Contribution (The "Add" Tab):**
    *   Users can directly add information to Memora's knowledge base.
    *   This can be plain text, or multi-modal inputs like images and voice transcriptions.
    *   The `processMultimediaInput` and `summarizeUserInformation` AI flows process these inputs, extracting and summarizing the key information into a structured log.

2.  **🤝 Collaborative Knowledge (The "Help" Tab):**
    *   When a user asks a question the AI can't answer, it can be posted to the "Help" section.
    *   Other users in the space can then provide answers.
    *   These community-vetted answers are then added as new information sources to the AI's knowledge base, effectively teaching the AI the correct answer for the future.

3.  **💬 Conversational Learning (The "Chat" Tab):**
    *   Users can engage in direct, one-on-one chats.
    *   A "Remember this" toggle allows users to flag specific conversations as important.
    *   When enabled, the content of these chats is added to the AI's knowledge base, capturing valuable information that emerges from natural dialogue.

All this information feeds into a central repository. When a user asks a question in the "Ask" tab, the `answerUserQuery` AI flow synthesizes an answer exclusively from this learned information, providing the sources and contributors for full transparency.

---

## ✨ Features

*   **AI-Powered Q&A:** A central chat interface where users can query the AI and get answers based on its accumulated knowledge.
*   **Multi-Modal Information Input:** Add knowledge via text, images, or voice-to-text dictation.
*   **Community Help Forum:** A Q&A section where users can help each other and simultaneously teach the AI.
*   **Source Transparency:** Every AI answer is backed by a list of sources, showing exactly where the information came from, who contributed it, and when.
*   **Direct User Chat:** A real-time chat feature for peer-to-peer communication within the space.
*   **Dynamic User Personas:** Users build out profiles with their department, clubs, and work experience, which helps the system identify subject-matter experts for community questions.
*   **Credit-Based Incentives:** Users earn credits for contributing knowledge, encouraging participation and knowledge sharing.
*   **Multi-User Simulation:** Easily switch between different user profiles to test and experience the app from various perspectives.

---

## 🛠️ Tech Stack

*   **Framework:** Next.js (App Router)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS with ShadCN UI components
*   **AI & GenAI:** Google Gemini via Genkit flows
*   **Backend & Database:** Firebase & Firestore
*   **Authentication:** Firebase Authentication (mocked with a user-switching context for demo purposes)
