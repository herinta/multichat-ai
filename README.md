# Multi-AI Chat Application

A modern, dynamic Next.js web application that enables users to interact with multiple AI agents in persistent chat rooms. Built with Next.js App Router, Supabase, and Google's Gemini API.

## Features

- **Modern Blue Landing Page**: Stunning blue glassmorphism landing page adapted from Dreamweave with live character simulator, voice sample previews, interactive mockups, and feature showcases.
- **Strict Route Protection & Seamless Log Out**: Unauthenticated visitors can only view the landing page and login screen; dashboard access is strictly protected until authenticated. One-click log out available in Sidebar, Profile, and Settings Modal.
- **Voice Call (1-on-1 & Group Calls)**: Real-time Discord/FaceTime-style voice calls with AI characters, featuring speech recognition, multi-agent turn-taking, inter-AI spoken banter, active speaker glow animations, live floating subtitles, and automated post-call memory consolidation to `rooms.memory`.
- **PWA & Add to Home Screen**: Installable as a native-feeling mobile/desktop app with custom icons, standalone UI, and iOS/Android support.
- **Push & Background Notifications**: Native notifications when an AI agent replies or initiates proactive chat while the tab is hidden or inactive.
- **Multi-Agent Group Chats**: Chat with multiple AI personalities in a single room with inter-AI auto replies.
- **AI Chat Duluan (Proactive Messaging)**: Characters proactively reach out to follow up on past plans (exams, interviews) or send natural casual thoughts.
- **Anti-Prompt Injection ("Manusia Bingung")**: Dual-layer defense where AI reacts like a baffled, teasing human friend to jailbreak attempts.
- **Explore & Character Marketplace**: Publish your AI personas, explore community agents, and like/clone them.
- **Dynamic AI Routing & Mentions**: Route messages to specific agents with `@AgentName` or intelligent context matching.
- **Cross-Room & Long-Term Memory**: Agents recall conversations across rooms, with automatic memory consolidation (>3 days).
- **Rich Media & Tools**: Markdown rendering, syntax highlighting, voice input, `/imagine` AI image generator, chat export to `.txt`.
- **Authentication & Realtime**: Powered by Supabase Auth, PostgreSQL, and Supabase Realtime for instant message and unread badge sync.
- **Modern UI**: Built with React 19, Tailwind CSS 4, multiple color themes, and custom components.

> 📖 **Full Documentation & Handover Guide**: See [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md) for complete technical architecture, database schema, bug fixes, and development backlog.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database & Auth**: Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- **AI Provider**: Google Generative AI (`gemini-3.5-flash-lite`)

## Prerequisites

To run this project locally, you need:
- Node.js (v18+ recommended)
- A Supabase project (URL and Anon Key)
- A Google Gemini API Key

## Environment Variables

Create a `.env.local` file in the root directory and add the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open the app:**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema (Supabase)

The application relies on the following key tables:
- `users` (Managed by Supabase Auth)
- `rooms`: Chat rooms created by users.
- `messages`: Stores chat history (both USER and AI).
- `agents`: Defines AI agents (name, role, system_prompt).
- `room_party`: Maps which agents are present in which rooms.

## Architecture Highlights

- **API Route (`/app/api/chat/route.ts`)**: The core engine that handles authentication checks, saves user messages, determines which AI agent should reply, fetches cross-room context, and streams the prompt to Gemini.
