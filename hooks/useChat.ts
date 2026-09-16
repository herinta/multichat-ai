import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { Room, Message, Agent } from "@/types/chat";
import { useToast } from "@/components/Modern/Toast";

export function useChat(
  activeChatId: string | null,
  activeRoom: Room | null,
  onUnreadMessage?: (roomId: string) => void
) {
  const supabase = createClient();
  const toast = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isCurrentlyTyping, setIsCurrentlyTyping] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUserMessages = useRef<string[]>([]);
  const aiChainCountRef = useRef(0);
  const activeChatIdRef = useRef(activeChatId);

  // Keep ref in sync
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  // Helper to map raw db message to Message type
  const mapMessage = useCallback((m: any): Message => {
    if (m.sender_type === "USER") return { ...m, senderName: "You" };
    const agent = activeRoom?.members.find(a => a.id === m.sender_id);
    return { ...m, senderName: agent ? agent.name : "AI" };
  }, [activeRoom]);

  // Fetch Messages + setup Realtime when Active Room changes
  useEffect(() => {
    if (!activeChatId) {
      setMessages([]);
      return;
    }

    // Reset AI chat chain when switching rooms
    aiChainCountRef.current = 0;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_id', activeChatId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }

      const mappedMsgs = data.map(mapMessage);
      setMessages(mappedMsgs);

      // --- AUTO DELETE / CONSOLIDATE MEMORY LOGIC ---
      if (mappedMsgs.length > 0) {
        const oldestMessage = mappedMsgs[0];
        const msgDate = new Date(oldestMessage.created_at);
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        if (msgDate < threeDaysAgo) {
          console.log("Found messages older than 3 days, consolidating memory...");
          fetch('/api/memory/consolidate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId: activeChatId })
          }).then(res => res.json()).then(result => {
            if (result.deletedCount) {
              console.log(`Consolidated and deleted ${result.deletedCount} old messages.`);
              const reFetch = async () => {
                const { data: newData } = await supabase.from('messages').select('*').eq('room_id', activeChatId).order('created_at', { ascending: true });
                if (newData) setMessages(newData.map(mapMessage));
              };
              reFetch();
            }
          }).catch(console.error);
        }
      }
    };

    fetchMessages();

    // --- SUPABASE REALTIME SUBSCRIPTION ---
    const channel = supabase
      .channel(`room-messages-${activeChatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${activeChatId}` },
        (payload) => {
          const newMsg = payload.new as any;
          // Skip messages from the current optimistic session (AI messages are already shown via local state)
          // Only add if it's a message from another user/device (sender_type USER from another session)
          // We detect this by checking if the message ID is already in our local state.
          // Since AI messages have real IDs assigned by DB, we can check if msg is already in list
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            
            // If this message matches an existing optimistic message, replace it instead of duplicating
            const optIndex = prev.findIndex(m =>
              m.id.startsWith("opt-") &&
              m.sender_type === newMsg.sender_type &&
              m.content === newMsg.content
            );

            const mappedNew: Message = {
              ...newMsg,
              senderName: newMsg.sender_type === "USER"
                ? "You"
                : (activeRoom?.members.find(a => a.id === newMsg.sender_id)?.name || "AI")
            };

            if (optIndex !== -1) {
              const updated = [...prev];
              updated[optIndex] = mappedNew;
              return updated;
            }

            return [...prev, mappedNew];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChatId, supabase, mapMessage, onUnreadMessage]);

  // Inter-AI Reply Logic
  useEffect(() => {
    if (messages.length === 0 || !activeRoom || activeRoom.type !== "group" || !activeChatId) return;

    const lastMsg = messages[messages.length - 1];

    if (lastMsg.sender_type !== "AI" || isCurrentlyTyping || pendingUserMessages.current.length > 0) {
      return;
    }

    if (aiChainCountRef.current >= 4) return;

    const timer = setTimeout(async () => {
      if (pendingUserMessages.current.length > 0 || isCurrentlyTyping) return;

      let respondingAgent: Agent | undefined = undefined;

      const mentionedAgent = activeRoom.members.find(m => {
        if (m.id === lastMsg.sender_id) return false;
        const name = m.name.toLowerCase();
        const text = lastMsg.content.toLowerCase();
        return text.includes(`@${name}`) || new RegExp(`\\b${name}\\b`).test(text);
      });

      if (mentionedAgent) {
        respondingAgent = mentionedAgent;
      } else if (Math.random() < 0.25) {
        const others = activeRoom.members.filter(m => m.id !== lastMsg.sender_id);
        if (others.length > 0) {
          respondingAgent = others[Math.floor(Math.random() * others.length)];
        }
      }

      if (!respondingAgent) {
        aiChainCountRef.current = 0;
        return;
      }

      aiChainCountRef.current += 1;
      setIsCurrentlyTyping(`${respondingAgent.name} is typing`);

      const previousContext = messages.map(m => ({
        role: m.sender_type === "USER" ? "user" : "model",
        content: m.content,
        sender_id: m.sender_id,
        sender_type: m.sender_type,
        senderName: m.senderName
      }));

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: activeChatId,
            userMessages: [],
            previousContext,
            forceAgentId: respondingAgent.id
          })
        });

        if (!res.ok) throw new Error('Failed API');
        const data = await res.json();

        if (data && data.messages && Array.isArray(data.messages)) {
          for (let i = 0; i < data.messages.length; i++) {
            const msg = data.messages[i];
            setIsCurrentlyTyping(`${msg.agentName} is typing`);
            const delay = Math.min(3000, Math.max(800, msg.text.length * 30));
            await new Promise(r => setTimeout(r, delay));
            setIsCurrentlyTyping(null);

            const optAiMsg: Message = {
              id: msg.id || `opt-ai-inter-${Date.now()}-${i}`,
              sender_type: "AI",
              sender_id: msg.agentId,
              content: msg.text,
              created_at: new Date().toISOString(),
              senderName: msg.agentName
            };
            setMessages(prev => [...prev, optAiMsg]);
            if (i < data.messages.length - 1) {
              await new Promise(r => setTimeout(r, 400));
            }
          }
        }
      } catch (err) {
        setIsCurrentlyTyping(null);
      }
    }, 4500);

    return () => clearTimeout(timer);
  }, [messages, activeRoom, activeChatId, isCurrentlyTyping]);

  const handleSendMessage = async (e: React.FormEvent | string) => {
    if (typeof e !== 'string') e.preventDefault();
    const msgText = typeof e === 'string' ? e : inputValue;

    if (!msgText.trim() || !activeChatId || !activeRoom) return;

    // --- /imagine command ---
    if (msgText.trim().toLowerCase().startsWith('/imagine ')) {
      const prompt = msgText.trim().slice(9).trim();
      if (!prompt) return;
      setInputValue("");
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true&seed=${Date.now()}`;
      const optImgMsg: Message = {
        id: `opt-img-${Date.now()}`,
        sender_type: "USER",
        content: `[IMAGE:${imageUrl}]`,
        created_at: new Date().toISOString(),
        senderName: "You"
      };
      setMessages(prev => [...prev, optImgMsg]);
      toast.info(`🎨 Generating: "${prompt}"`);

      // Persist to Supabase so it's not lost on refresh
      supabase.from('messages').insert({
        room_id: activeChatId,
        sender_type: 'USER',
        content: `[IMAGE:${imageUrl}]`,
      }).then(({ error }) => {
        if (error) console.error("Failed to save imagine image:", error);
      });
      return;
    }

    setInputValue("");
    aiChainCountRef.current = 0;

    const optUserMsg: Message = {
      id: `opt-${Date.now()}`,
      sender_type: "USER",
      content: msgText,
      created_at: new Date().toISOString(),
      senderName: "You"
    };

    setMessages(prev => [...prev, optUserMsg]);
    pendingUserMessages.current.push(msgText);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      const messagesToSend = [...pendingUserMessages.current];
      if (messagesToSend.length === 0) return;
      pendingUserMessages.current = [];

      const previousContext = messages.map(m => ({
        role: m.sender_type === "USER" ? "user" : "model",
        content: m.content,
        sender_id: m.sender_id,
        sender_type: m.sender_type,
        senderName: m.senderName
      }));

      let respondingAgents: Agent[] = [];
      const combinedText = messagesToSend.join(' ').toLowerCase();

      for (const agent of activeRoom.members) {
        const name = agent.name.toLowerCase();
        if (combinedText.includes(`@${name}`) || new RegExp(`\\b${name}\\b`).test(combinedText)) {
          respondingAgents.push(agent);
        }
      }

      if (respondingAgents.length === 0 && activeRoom.members.length > 0) {
        const randomAgent = activeRoom.members[Math.floor(Math.random() * activeRoom.members.length)];
        respondingAgents.push(randomAgent);
      }

      if (activeRoom.type === "group") {
        for (const agent of activeRoom.members) {
          if (!respondingAgents.some(a => a.id === agent.id)) {
            if (Math.random() < 0.3) {
              respondingAgents.push(agent);
            }
          }
        }
      }

      let typingString = "typing";
      if (activeRoom.type === "group") {
        if (respondingAgents.length === 1) {
          typingString = `${respondingAgents[0].name} is typing`;
        } else if (respondingAgents.length === 2) {
          typingString = `${respondingAgents[0].name} and ${respondingAgents[1].name} are typing`;
        } else if (respondingAgents.length > 2) {
          typingString = `Multiple people are typing`;
        }
      }

      setIsCurrentlyTyping(typingString);

      try {
        const fetchPromises = respondingAgents.map((agent, index) =>
          fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              roomId: activeChatId,
              userMessages: messagesToSend,
              previousContext,
              forceAgentId: agent.id,
              saveUserMessages: index === 0
            })
          }).then(res => {
            if (!res.ok) throw new Error('Failed to fetch');
            return res.json();
          }).catch(e => null)
        );

        const results = await Promise.all(fetchPromises);

        let allReturnedMessages: any[] = [];
        for (const data of results) {
          if (data && data.messages && Array.isArray(data.messages)) {
            allReturnedMessages = allReturnedMessages.concat(data.messages);
          }
        }

        if (allReturnedMessages.length === 0) {
          setIsCurrentlyTyping(null);
        }

        for (let i = 0; i < allReturnedMessages.length; i++) {
          const msg = allReturnedMessages[i];

          setIsCurrentlyTyping(activeRoom.type === "group" ? `${msg.agentName || 'AI'} is typing` : "typing");

          const delay = Math.min(3000, Math.max(800, msg.text.length * 30));
          await new Promise(r => setTimeout(r, delay));

          setIsCurrentlyTyping(null);

          const optAiMsg: Message = {
            id: msg.id || `opt-ai-${Date.now()}-${i}`,
            sender_type: "AI",
            sender_id: msg.agentId,
            content: msg.text,
            created_at: new Date().toISOString(),
            senderName: msg.agentName
          };

          setMessages(prev => prev.some(m => m.id === optAiMsg.id) ? prev : [...prev, optAiMsg]);

          if (i < allReturnedMessages.length - 1) {
            await new Promise(r => setTimeout(r, 400));
          }
        }
      } catch (error) {
        console.error("Chat API Error:", error);
        toast.error("Gagal kirim pesan ke AI. Coba lagi.");
        setIsCurrentlyTyping(null);
      }
    }, 3000);
  };

  const handleClearChat = useCallback(async () => {
    if (!activeChatId) return;
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('room_id', activeChatId);

      if (error) throw error;
      setMessages([]);
      toast.success("Riwayat pesan berhasil dibersihkan.");
    } catch (e) {
      console.error("Failed to clear messages", e);
      toast.error("Gagal membersihkan riwayat pesan.");
    }
  }, [activeChatId, supabase, toast]);

  return {
    messages,
    inputValue,
    setInputValue,
    isCurrentlyTyping,
    handleSendMessage,
    handleClearChat
  };
}
