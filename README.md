# Multi-AI Chat Application

A modern, dynamic Next.js web application that enables users to interact with multiple AI agents in persistent chat rooms. Built with Next.js App Router, Supabase, and Google's Gemini API.

## Features

- **Multi-Agent Group Chats**: Chat with multiple AI personalities in a single room.
- **Dynamic AI Routing**: The system intelligently routes messages to specific agents based on mentions (e.g., `@AgentName`) or context.
- **Cross-Room Memory**: Agents possess global memory and can recall interactions with users across different chat rooms.
- **Custom Personas**: Agents are configured with specific system prompts and a default "casual Indonesian slang" persona.
- **Authentication & Database**: Powered by Supabase for secure user authentication, room management, and message history storage.
- **Modern UI**: Built with React 19, Tailwind CSS 4, and custom components (`Modal`, `Button`, etc.).

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
