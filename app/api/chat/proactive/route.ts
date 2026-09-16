import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface ProactiveRequestBody {
  roomId?: string;
  force?: boolean;
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    // 1. Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: ProactiveRequestBody = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is valid
    }

    const { roomId, force = false } = body;

    // 2. Fetch candidate rooms
    let query = supabase
      .from('rooms')
      .select(`
        id, title, user_id, memory, user_persona_id,
        room_party (
          agent_id,
          agents ( id, name, role, system_prompt, avatar_url )
        )
      `)
      .eq('user_id', user.id);

    if (roomId) {
      query = query.eq('id', roomId);
    }

    const { data: candidateRooms, error: roomsError } = await query;
    if (roomsError || !candidateRooms || candidateRooms.length === 0) {
      return NextResponse.json({ triggered: false, reason: 'No eligible rooms found' });
    }

    // 3. Find an eligible room that satisfies anti-spam and cooldown
    let selectedRoom: any = null;
    let selectedAgent: any = null;
    let recentMessages: any[] = [];

    // Shuffle candidate rooms to distribute spontaneous chats across contacts
    const shuffledRooms = [...candidateRooms].sort(() => Math.random() - 0.5);

    for (const room of shuffledRooms) {
      // Fetch latest message in this room
      const { data: msgs } = await supabase
        .from('messages')
        .select('id, sender_type, sender_id, content, created_at')
        .eq('room_id', room.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!msgs || msgs.length === 0) {
        // Empty room: If force is true, we can trigger greeting, otherwise skip
        if (force) {
          selectedRoom = room;
          recentMessages = [];
          break;
        }
        continue;
      }

      const latestMsg = msgs[0];

      // Anti-Spam Guardrail: Never send proactive message if last message was already from AI (waiting for user response)
      if (latestMsg.sender_type === 'AI' && !force) {
        continue;
      }

      // Cooldown Guardrail: Check time since last message
      if (!force) {
        const timeSinceLastMsg = Date.now() - new Date(latestMsg.created_at).getTime();
        const minCooldownMs = 3 * 60 * 60 * 1000; // 3 hours minimum silence
        if (timeSinceLastMsg < minCooldownMs) {
          continue;
        }
      }

      // Found an eligible room!
      selectedRoom = room;
      recentMessages = [...msgs].reverse(); // chronological order
      break;
    }

    if (!selectedRoom) {
      return NextResponse.json({ 
        triggered: false, 
        reason: 'No rooms met the eligibility criteria (e.g. cooldown or awaiting user reply)' 
      });
    }

    // 4. Select an agent from the room's members
    const members = selectedRoom.room_party
      .map((rp: any) => Array.isArray(rp.agents) ? rp.agents[0] : rp.agents)
      .filter(Boolean);

    if (members.length === 0) {
      return NextResponse.json({ triggered: false, reason: 'Room has no agents' });
    }

    selectedAgent = members[Math.floor(Math.random() * members.length)];

    // 5. Fetch user persona if set
    let personaContext = "";
    if (selectedRoom.user_persona_id) {
      const { data: persona } = await supabase
        .from('user_personas')
        .select('*')
        .eq('id', selectedRoom.user_persona_id)
        .maybeSingle();
      if (persona) {
        personaContext = `The user goes by "${persona.name}". Traits: ${persona.personality || 'friendly'}. Background: ${persona.background || 'none'}.`;
      }
    }

    // 6. Format past conversation context
    const transcript = recentMessages
      .map(m => `[${m.sender_type === 'USER' ? 'User' : 'AI'}]: ${m.content}`)
      .join('\n');

    // 7. Generate Proactive Message with Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' });

    const prompt = `
=== YOUR CHARACTER IDENTITY ===
Name: ${selectedAgent.name}
Personality & System Prompt: ${selectedAgent.system_prompt}
${personaContext ? `User Persona: ${personaContext}` : ''}
===============================

CRITICAL TASK:
You are spontaneously initiating a chat with the user in your direct messages ("chat duluan"). Act like a real friend or companion reaching out naturally.

--- CONVERSATION HISTORY ---
${transcript || "No recent messages."}
----------------------------

--- LONG TERM MEMORY ---
${selectedRoom.memory || "No long term memory recorded."}
------------------------

STRICT CONVERSATIONAL RULES:
1. FACTUAL FOLLOW-UP PRIORITY:
   - Check the memory and recent messages for any SPECIFIC plans, commitments, or events the user mentioned (e.g., ujian, sidang, interview kerja, sakit, liburan, deadline tugas, nonton film).
   - If found and relevant, casually ask about it or follow up on how it went!
     Examples: "eh gimana ujian lu kemaren lancar ga?", "udah kelar belom kerjaan yg kemarin?", "interview lu gimana aman ga?"
2. SPONTANEOUS RANDOM CHAT (FALLBACK):
   - If there are NO specific events or plans, DO NOT INVENT OR FABRICATE ANY FAKE PAST EVENTS!
   - Instead, send a very natural casual chat starter, inside joke, relatable thought, or random curiosity suited to your character:
     Examples: "tumben sepi lu lagi sibuk ya", "lagi ngapain lu", "gabut bgt gue jam segini wkwk", "eh lu tau ga sih tadi...", "lapar bgt gue pengen seblak"
3. CHARACTER VOICE FIDELITY:
   - Stay 100% in your character's voice and attitude (e.g. tsundere, warm, witty, chill slacker, or thoughtful).
   - Use natural Indonesian chat phrasing and abbreviations (yg, udh, bgt, ga, wkwk, emojis) organically if chatting casually.
   - Length: Exactly 1 or maximum 2 punchy sentences.
   - NEVER sound like a corporate AI bot. NEVER offer help ("ada yang bisa kubantu?"). Chat like a real person.
4. Output ONLY the raw chat message text. No quotes, no intro text, no formatting wrappers.
`;

    const result = await model.generateContent(prompt);
    let aiText = result.response.text().trim();

    // Clean any unwanted surrounding quotes or markdown
    aiText = aiText.replace(/^["'`]|["'`]$/g, '').trim();

    if (!aiText) {
      return NextResponse.json({ triggered: false, reason: 'Empty response generated' });
    }

    // 8. Insert AI message into Supabase database
    const { data: insertedMsg, error: insertError } = await supabase
      .from('messages')
      .insert({
        room_id: selectedRoom.id,
        sender_type: 'AI',
        sender_id: selectedAgent.id,
        content: aiText,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert proactive message:', insertError);
      return NextResponse.json({ error: 'Failed to insert message' }, { status: 500 });
    }

    return NextResponse.json({
      triggered: true,
      message: {
        id: insertedMsg.id,
        roomId: selectedRoom.id,
        roomTitle: selectedRoom.title,
        agentId: selectedAgent.id,
        agentName: selectedAgent.name,
        content: aiText,
        createdAt: insertedMsg.created_at
      }
    });

  } catch (error) {
    console.error('Proactive API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
