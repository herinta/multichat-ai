# Multi-AI Project Documentation

## 1. Project Overview
**Multi-AI** is a Next.js application that allows users to create and participate in private or group chat rooms populated by AI agents. These agents have unique personas, can interact with the user, and can even interact with each other in group chats based on context and mentions.

### Core Technologies
*   **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4
*   **Backend API**: Next.js Route Handlers (`/api/chat`)
*   **Database & Auth**: Supabase
*   **AI Provider**: Google Generative AI (Gemini 3.5 Flash Lite)

---

## 2. Architecture & Directory Structure

*   `/app/api/chat/route.ts`: The core AI engine. Handles routing messages to the correct AI, fetching cross-room memory, injecting personas, and streaming responses from Gemini.
*   `/app/page.tsx`: The main Dashboard frontend. A heavy component (nearly 1000 lines) that manages all UI states (sidebar, chat area, info panel, modals) and local message state.
*   `/components/Modern/`: Reusable UI components styled with Tailwind (Button, Modal, Bubble).
*   `/hooks/useTypewriter.ts`: Custom hook to create the typewriter effect when AI agents are responding.
*   `/utils/supabase/`: Supabase client initialization.

---

## 3. Database Schema (Supabase)

The application uses a relational model to link users, rooms, and agents.

1.  **`users`**: Managed by Supabase Auth.
2.  **`rooms`**:
    *   `id` (UUID), `title` (String), `user_id` (FK to `users`)
3.  **`agents`**:
    *   `id` (UUID), `name` (String), `role` (String), `system_prompt` (Text - defines the persona)
4.  **`room_party`**: Junction table mapping agents to rooms.
    *   `room_id` (FK to `rooms`), `agent_id` (FK to `agents`)
5.  **`messages`**:
    *   `id` (UUID), `room_id` (FK), `sender_type` ('USER' | 'AI'), `sender_id` (FK to `agents`, null if USER), `content` (Text), `created_at` (Timestamp)

---

## 4. Key Mechanics & Features

### A. Dynamic AI Routing & Mention System
In a group chat, the system doesn't just send the message to every AI. It intelligently routes it:
1.  **Direct Mentions**: If a user types `@AgentName`, that specific agent is guaranteed to reply.
2.  **Contextual Chime-in**: If no one is mentioned, a random agent is picked. Other agents in the room have a ~30% chance to also chime in.
3.  **Inter-AI Conversation**: If a user goes silent for 4.5 seconds, and the last message was from an AI, there is a chance another AI will reply to the first AI, creating a continuous conversation loop (capped at 4 chains to prevent infinite loops).

### B. Global AI Memory (Cross-Room Context)
When an agent replies, the API fetches the last 15 messages from *other* rooms that the agent is a part of. This gives the agent a "global memory" so they can remember past interactions with the user outside of the current room.

### C. Persona System
By default, the system injects a "Casual Indonesian Slang" persona into every agent (lowercase only, no punctuation, using words like 'wkwk', 'gpp', 'bjirr'). The user can define a specific characteristic when creating the agent, which is appended to this core persona.

### D. Optimistic UI
When a user sends a message, it appears immediately on the screen (Optimistic UI) before the database or API confirms it. It groups messages sent in quick succession (3-second debounce) into "Bubbles" to send to the AI as a single context block.

---

## 5. Current Progress & Status Report

**✅ Completed Features (MVP):**
*   Supabase Authentication (Login/Logout functionality).
*   Creating Private Chats (1 on 1 with AI).
*   Creating Group Chats (Selecting multiple existing AIs).
*   Real-time typing indicators with simulated delays based on text length.
*   Typewriter effect for incoming AI messages.
*   Complex AI logic (routing, mentions, cross-room memory, persona constraints).
*   Sidebar with chat filtering (All/Private/Group).
*   Info Panel to view room details and add new members to existing rooms.

**⏳ Pending / Missing Features (Room for Improvement):**
1.  **Code Refactoring**: `app/page.tsx` is too large (~1000 lines). State logic, API calls, and UI components should be separated into smaller React components (e.g., `<Sidebar>`, `<ChatArea>`, `<InfoPanel>`).
2.  **Real-time Subscriptions**: The app currently fetches messages on load and updates local state when sending. If the user uses the app on two devices, messages won't sync in real-time unless refreshed. Supabase Realtime needs to be implemented on the `messages` table.
3.  **Agent Management**: Users can create agents during chat creation, but there is no dedicated page to edit an agent's name or `system_prompt` after they are created.
4.  **Error Handling**: API errors during chat generation are mostly ignored to prevent crashing the whole group chat. Better user feedback is needed when an AI fails to respond.
5.  **Markdown Rendering**: The default persona forces "PLAIN TEXT ONLY". If we want agents to share code or format text, we need a Markdown renderer in the `Bubble` component.
