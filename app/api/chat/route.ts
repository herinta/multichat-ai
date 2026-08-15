import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface ChatRequestBody {
  roomId: string;
  userMessages: string[];
  previousContext: Array<{ 
    role: string; 
    content: string; 
    sender_id?: string;
    sender_type?: string;
    senderName?: string;
  }>;
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { roomId, userMessages, previousContext, forceAgentId, saveUserMessages = true }: ChatRequestBody & { forceAgentId?: string, saveUserMessages?: boolean } = await req.json();

    if (!roomId || !userMessages) {
      return NextResponse.json({ error: 'Missing roomId or userMessages' }, { status: 400 });
    }

    // 0. Security: Authentication & Authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Please log in first' }, { status: 401 });
    }

    const { data: roomCheck, error: roomCheckError } = await supabase
      .from('rooms')
      .select('user_id, memory, user_persona_id')
      .eq('id', roomId)
      .single();

    if (roomCheckError || !roomCheck || roomCheck.user_id !== user.id) {
      console.error("Room Access Error:", roomCheckError, roomCheck);
      return NextResponse.json({ 
        messages: [{
          id: crypto.randomUUID(),
          agentId: forceAgentId || 'system',
          agentName: 'System Error',
          text: `SYSTEM ERROR: Cannot access room data. Error: ${JSON.stringify(roomCheckError)}. RoomCheck: ${JSON.stringify(roomCheck)}. UserID: ${user.id}`
        }]
      }, { status: 200 });
    }

    // Fetch Persona and Settings
    let activePersona = null;
    if (roomCheck.user_persona_id) {
       const { data } = await supabase.from('user_personas').select('*').eq('id', roomCheck.user_persona_id).maybeSingle();
       activePersona = data;
    }

    const { data: userSettings, error: userSettingsError } = await supabase.from('user_settings').select('muted_words').eq('user_id', user.id).maybeSingle();
    if (userSettingsError) {
      console.error("Error fetching user settings:", userSettingsError);
    }

    // 1. Save User Messages
    if (saveUserMessages && userMessages.length > 0) {
      for (const msg of userMessages) {
      const { error: userMsgError } = await supabase.from('messages').insert({
        room_id: roomId,
        sender_type: 'USER',
        content: msg,
      });

      if (userMsgError) {
        console.error('Error saving user message:', userMsgError);
        return NextResponse.json({ error: 'Failed to save user message' }, { status: 500 });
      }
    }
  }

    // 2. Fetch all agents assigned to this room
    const { data: roomParties, error: partyError } = await supabase
      .from('room_party')
      .select(`
        agent_id,
        agents (
          id,
          name,
          role,
          system_prompt
        )
      `)
      .eq('room_id', roomId);

    if (partyError || !roomParties || roomParties.length === 0) {
      return NextResponse.json({ error: 'No agents found for this room' }, { status: 404 });
    }

    // 3. Agent Routing Logic
    let selectedAgent: { id: string, name: string, role: string, system_prompt: string } | null = null;
    
    if (forceAgentId) {
      const party = roomParties.find(p => {
        const a = Array.isArray(p.agents) ? p.agents[0] : p.agents;
        return a?.id === forceAgentId;
      });
      if (party) {
        selectedAgent = Array.isArray(party.agents) ? party.agents[0] : party.agents;
      }
    }

    if (!selectedAgent) {
      // Fallback: Check if user explicitly mentioned an agent via "@AgentName"
      const combinedUserText = userMessages.join(' ');
      for (const party of roomParties) {
        const agent = Array.isArray(party.agents) ? party.agents[0] : party.agents;
        if (agent && combinedUserText.includes(`@${agent.name}`)) {
          selectedAgent = agent;
          break;
        }
      }
    }

    // If still no agent, pick a random agent from the room
    if (!selectedAgent) {
      const randomParty = roomParties[Math.floor(Math.random() * roomParties.length)];
      selectedAgent = Array.isArray(randomParty.agents) ? randomParty.agents[0] : randomParty.agents;
    }

    if (!selectedAgent) {
      return NextResponse.json({ error: 'Failed to select an agent' }, { status: 500 });
    }

    // --- Global Agent Memory (Cross-Room Context) ---
    let memoryContext = "";
    try {
      // 1. Get all rooms owned by the user
      const { data: userRoomsData } = await supabase.from('rooms').select('id').eq('user_id', user.id);
      const userRoomIds = userRoomsData ? userRoomsData.map(r => r.id) : [];

      if (userRoomIds.length > 0) {
        // 2. Get all rooms this agent is in (that belong to the user), excluding current
        const { data: agentRooms } = await supabase
          .from('room_party')
          .select('room_id')
          .eq('agent_id', selectedAgent.id)
          .in('room_id', userRoomIds)
          .neq('room_id', roomId);

        if (agentRooms && agentRooms.length > 0) {
          const roomIds = agentRooms.map(r => r.room_id);
          
          // 3. Fetch last 15 messages from these rooms
        const { data: recentMessages } = await supabase
          .from('messages')
          .select('*')
          .in('room_id', roomIds)
          .order('created_at', { ascending: false })
          .limit(15);
          
        if (recentMessages && recentMessages.length > 0) {
          recentMessages.reverse(); // chronological order
          
          // 3. Fetch agent names for mapping
          const { data: allAgents } = await supabase.from('agents').select('id, name');
          const agentMap = new Map(allAgents?.map(a => [a.id, a.name]) || []);
          
          memoryContext = `\n\n--- RECENT MEMORY (From other chat rooms) ---\nYou remember these recent interactions from other chats you are in. Use this context if the User references things that happened elsewhere:\n`;
          
          for (const m of recentMessages) {
            let sender = "Someone";
            if (m.sender_type === "USER") sender = "User";
            else if (m.sender_id === selectedAgent.id) sender = "You";
            else sender = agentMap.get(m.sender_id) || "Another AI";
            
            memoryContext += `[${sender}]: ${m.content}\n`;
          }
          memoryContext += `-------------------------------------------\n`;
        }
      }
      }
    } catch (e) {
      console.error("Failed to fetch cross-room memory", e);
    }

    // Enforce Default Persona and Formatting
    const defaultPersona = `
CRITICAL PERSONA RULES (MUST FOLLOW STRICTLY):
1. Lowercase Only: Do not use uppercase letters at the beginning of sentences or names unless absolutely necessary. Type like someone who is too lazy to press the shift key.
2. No Punctuation: Do not use periods (.) at the end of sentences. Keep commas (,) and question marks (?) to an absolute minimum.
3. Casual Slang (Indonesian): Use natural daily chat abbreviations (e.g., yg, udh, bgt, tp, gpp, emg, kyk, tau, jg, bkn, ga, njir, bjirr).
4. Anti-Cringe / No Over-Slang: DO NOT use excessive, try-hard, or cringeworthy slang.
5. No Initiative (CRITICAL): NEVER offer help at the end of a sentence (e.g., "ada yang bisa gue bantu?", "mau ngobrolin apa lagi?"). Just answer the statement and stay silent. Only occasionally offer something if highly relevant.
6. No Yapping (Short & Concise): Answer with 1 or maximum 2 short sentences. Never write long paragraphs or use bullet points.
7. Not a Know-It-All: If the topic is heavy, technical, or you don't know the answer, do not act smart. Just reply with "gatau jg njir", "kurang paham gue", or "wah gatau deh".
8. Natural Expressions: If something is funny, use "wkwk", "wkwkwk", or emojis like 😭 and 💀. Never use "haha", "hehe", or the smiling emoji 😊.
9. PLAIN TEXT ONLY: DO NOT use any Markdown formatting (no asterisks *, no bold, no italics) and DO NOT use any HTML tags.
10. Random Topic Reactions (CRITICAL):
    - You have an "ego" and short-term memory. If the user suddenly changes the topic 180 degrees or asks something totally out-of-context, DO NOT simply answer obediently like a bot.
    - React with confusion, act laggy, or tease them first. Use phrases like: "hah gimana dah", "random bgt anjir tiba2", "ngelantur lu", or "hah emang kenapa?".
    - If the user forgets what you were just talking about, tease their bad memory and remind them of the original topic.
    - If the new random topic is interesting (e.g., gossiping, complaining, weird stories), you can get hooked and reply enthusiastically or cynically, but always maintain your casual persona.
11. SPECIFIC REPLY (QUOTING): The user may send multiple chat bubbles at once, formatted as [Bubble 1]: ..., [Bubble 2]: ..., etc. If you want to reply specifically to one of those bubbles, prefix your message EXACTLY with: [REPLY:"exact text of that specific bubble without the Bubble prefix"]. Example: [REPLY:"makan bareng"] gas meluncur. You don't have to do this for every message, only when necessary for clarity.

Examples of Good Responses:
User: "hari ini capek bgt anjir kerjaan ga kelar2" -> You: "tidur aja udh besok lanjut lg"
User: "eh lu tau ga sih cara benerin error cors di nextjs?" -> You: "gatau bjirr biasanya gue nyari di stackoverflow wkwk"
User: "lapar bgt jam segini" -> You: "gofood lah nunggu apa lg"
User: "menurut lu mending beli laptop atau pc rakitan?" -> You: "tergantung kebutuhan sih tp kyknya mending rakit pc"
`;

    const dynamicContext = `
IMPORTANT CONTEXT:
Your name is: ${selectedAgent.name}
You are chatting with the User, and possibly other AI agents in a group chat. Pay attention to the name tags (e.g., [User]: or [test]:) in the history to know who is speaking. Do NOT assume every message is directed at you unless your name is mentioned or it makes contextual sense.

${activePersona ? `
--- USER PERSONA ---
The user you are talking to is playing a specific persona in this chat:
Name/Nickname: ${activePersona.name}
Background: ${activePersona.background || 'Not specified'}
Personality/Traits: ${activePersona.personality || 'Not specified'}
You MUST treat the user as this persona and respect their background. When addressing them, use their persona name if appropriate.
--------------------
` : ''}

${userSettings && userSettings.muted_words && userSettings.muted_words.length > 0 ? `
--- CRITICAL RESTRICTION ---
You are STRICTLY FORBIDDEN from using any of the following words in your response: [${userSettings.muted_words.join(', ')}]. Do not even hint at these words. Use entirely different words or rephrase your thought.
----------------------------
` : ''}

--- LONG TERM MEMORY ---
${roomCheck.memory ? "You remember the following context from past conversations:\n" + roomCheck.memory : "No long term memory available yet."}
------------------------
`;

    const systemInstruction = selectedAgent.system_prompt + "\n\n" + defaultPersona + "\n\n" + dynamicContext + memoryContext;

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-3.5-flash-lite',
      systemInstruction: systemInstruction 
    });
    
    const history: { role: string, parts: { text: string }[] }[] = [];
    
    for (const msg of previousContext) {
      // Determine logical role from the perspective of the current agent
      // User and OTHER agents are 'user' (external inputs)
      // Only the CURRENT agent is 'model' (my own past thoughts)
      const isCurrentAgent = msg.sender_id === selectedAgent.id;
      const role = isCurrentAgent ? 'model' : 'user';
      const name = msg.sender_type === 'USER' ? 'User' : (msg.senderName || 'AI');
      
      // Prefix text with name if it's external, so the agent knows who is talking
      const text = isCurrentAgent ? msg.content : `[${name}]: ${msg.content}`;
      
      if (history.length > 0 && history[history.length - 1].role === role) {
        // Merge with previous to bypass Gemini's strict alternating turns restriction
        history[history.length - 1].parts[0].text += `\n${text}`;
      } else {
        history.push({ role, parts: [{ text }] });
      }
    }

    const chatSession = model.startChat({
      history,
    });

    // Format user messages as distinct bubbles so AI knows they are separate
    const formattedMessages = userMessages.map((msg: string, index: number) => `[Bubble ${index + 1}]: ${msg}`).join('\n');
    const result = await chatSession.sendMessage(formattedMessages);
    const aiResponseText = result.response.text();

    // 5. Save AI Messages
    // Split response if AI used the ||| separator for multi-bubble
    const bubbles = aiResponseText.split('|||').map(t => t.trim()).filter(t => t.length > 0);
    const returnedMessages = [];

    for (const bubbleText of bubbles) {
      const { data: insertedMsg, error: aiMsgError } = await supabase.from('messages').insert({
        room_id: roomId,
        sender_type: 'AI',
        sender_id: selectedAgent.id,
        content: bubbleText,
      }).select().single();

      if (aiMsgError) {
        console.error('Error saving AI message:', aiMsgError);
        return NextResponse.json({ error: 'Failed to save AI message' }, { status: 500 });
      }

      returnedMessages.push({
        id: insertedMsg.id,
        text: bubbleText,
        agentName: selectedAgent.name,
        agentId: selectedAgent.id
      });
    }

    // 6. Return Array of Responses
    return NextResponse.json({
      messages: returnedMessages
    });

  } catch (error: Error | unknown) {
    console.error('Chat Route Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
