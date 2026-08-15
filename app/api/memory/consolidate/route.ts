import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);

    const { roomId } = await req.json();
    if (!roomId) {
      return NextResponse.json({ error: 'Missing roomId' }, { status: 400 });
    }

    // 1. Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch Room & Current Memory
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('user_id, memory')
      .eq('id', roomId)
      .single();

    if (roomError || !room || room.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden or Room not found' }, { status: 403 });
    }

    // 3. Find messages older than 3 days
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const { data: oldMessages, error: messagesError } = await supabase
      .from('messages')
      .select('id, sender_type, sender_id, content, created_at')
      .eq('room_id', roomId)
      .lte('created_at', threeDaysAgo.toISOString())
      .order('created_at', { ascending: true });

    if (messagesError) {
      return NextResponse.json({ error: 'Failed to fetch old messages' }, { status: 500 });
    }

    if (!oldMessages || oldMessages.length === 0) {
      return NextResponse.json({ message: 'No messages to consolidate' });
    }

    // 4. Fetch Agent Names for context
    const { data: agents } = await supabase.from('agents').select('id, name');
    const agentMap = new Map(agents?.map(a => [a.id, a.name]) || []);

    // Format transcript
    let transcript = "--- OLD CHAT TRANSCRIPT TO SUMMARIZE ---\n";
    for (const m of oldMessages) {
      const sender = m.sender_type === "USER" ? "User" : (agentMap.get(m.sender_id) || "AI");
      transcript += `[${sender}]: ${m.content}\n`;
    }

    // 5. Ask Gemini to Summarize
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' });
    const prompt = `
You are a highly efficient memory-consolidation AI for a chat application.
Your task is to merge the following old chat transcript into the existing long-term memory.
Rules:
- Keep the summary concise but retain important facts, user preferences, inside jokes, and relationship dynamics.
- Discard trivial chatter (e.g., "hello", "how are you", "brb").
- Output ONLY the newly consolidated memory paragraph. No conversational intro.
- If there is an existing memory, update it. If not, create a new one based on the transcript.

Existing Memory:
${room.memory || "No existing memory."}

Transcript:
${transcript}
`;

    const result = await model.generateContent(prompt);
    const newMemory = result.response.text().trim();

    if (!newMemory) {
       return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
    }

    // 6. Save new memory
    const { error: updateError } = await supabase
      .from('rooms')
      .update({ memory: newMemory })
      .eq('id', roomId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to save new memory' }, { status: 500 });
    }

    // 7. Delete old messages
    const messageIdsToDelete = oldMessages.map(m => m.id);
    const { error: deleteError } = await supabase
      .from('messages')
      .delete()
      .in('id', messageIdsToDelete);

    if (deleteError) {
      console.error("Failed to delete messages, but memory was updated:", deleteError);
    }

    return NextResponse.json({ 
      message: 'Memory consolidated successfully', 
      deletedCount: messageIdsToDelete.length 
    });

  } catch (error) {
    console.error('Consolidate API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
