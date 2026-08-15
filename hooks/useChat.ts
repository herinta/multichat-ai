import { useState, useRef, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Room, Message, Agent } from "@/types/chat";

export function useChat(activeChatId: string | null, activeRoom: Room | null) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isCurrentlyTyping, setIsCurrentlyTyping] = useState<string | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUserMessages = useRef<string[]>([]);
  const aiChainCountRef = useRef(0);

  // Fetch Messages when Active Room changes
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
      
      // Map sender names
      const mappedMsgs = data.map((m) => {
        if (m.sender_type === "USER") return { ...m, senderName: "You" };
        const agent = activeRoom?.members.find(a => a.id === m.sender_id);
        return { ...m, senderName: agent ? agent.name : "AI" };
      });

      setMessages(mappedMsgs);

      // --- AUTO DELETE / CONSOLIDATE MEMORY LOGIC ---
      if (mappedMsgs.length > 0) {
        const oldestMessage = mappedMsgs[0];
        const msgDate = new Date(oldestMessage.created_at);
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        if (msgDate < threeDaysAgo) {
          console.log("Found messages older than 3 days, consolidating memory...");
          // Trigger consolidate asynchronously without blocking UI
          fetch('/api/memory/consolidate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId: activeChatId })
          }).then(res => res.json()).then(result => {
            if (result.deletedCount) {
              console.log(`Consolidated and deleted ${result.deletedCount} old messages.`);
              // Re-fetch messages to reflect deletions
              const reFetch = async () => {
                const { data: newData } = await supabase.from('messages').select('*').eq('room_id', activeChatId).order('created_at', { ascending: true });
                if (newData) {
                  setMessages(newData.map(m => {
                    if (m.sender_type === "USER") return { ...m, senderName: "You" };
                    const agent = activeRoom?.members.find(a => a.id === m.sender_id);
                    return { ...m, senderName: agent ? agent.name : "AI" };
                  }));
                }
              };
              reFetch();
            }
          }).catch(console.error);
        }
      }
    };

    fetchMessages();
  }, [activeChatId, activeRoom, supabase]);

  // Inter-AI Reply Logic
  useEffect(() => {
    if (messages.length === 0 || !activeRoom || activeRoom.type !== "group" || !activeChatId) return;

    const lastMsg = messages[messages.length - 1];
    
    // Only trigger if last message was from AI, and we aren't currently typing/fetching
    if (lastMsg.sender_type !== "AI" || isCurrentlyTyping || pendingUserMessages.current.length > 0) {
      return;
    }
    
    // Stop if they've talked too much by themselves
    if (aiChainCountRef.current >= 4) return;

    const timer = setTimeout(async () => {
      // Check again after silence to ensure user hasn't started typing
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
      } else if (Math.random() < 0.25) { // 25% chance someone else chimes in naturally
        const others = activeRoom.members.filter(m => m.id !== lastMsg.sender_id);
        if (others.length > 0) {
          respondingAgent = others[Math.floor(Math.random() * others.length)];
        }
      }

      if (!respondingAgent) {
        aiChainCountRef.current = 0; // Chain naturally ended
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
            userMessages: [], // AI reacting to context only
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
    }, 4500); // 4.5 seconds of silence from the user before AIs start talking to each other

    return () => clearTimeout(timer);
  }, [messages, activeRoom, activeChatId, isCurrentlyTyping]);

  const handleSendMessage = async (e: React.FormEvent | string) => {
    if (typeof e !== 'string') e.preventDefault();
    const msgText = typeof e === 'string' ? e : inputValue;

    if (!msgText.trim() || !activeChatId || !activeRoom) return;

    setInputValue("");
    aiChainCountRef.current = 0; // Reset AI chatter chain when user types
    
    // Optimistic UI update immediately
    const optUserMsg: Message = {
      id: `opt-${Date.now()}`,
      sender_type: "USER",
      content: msgText,
      created_at: new Date().toISOString(),
      senderName: "You"
    };
    
    setMessages(prev => [...prev, optUserMsg]);
    
    // Queue message
    pendingUserMessages.current.push(msgText);
    
    // Reset timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      // Capture queued messages
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

      // Determine which agents will respond
      let respondingAgents: Agent[] = [];
      const combinedText = messagesToSend.join(' ').toLowerCase();
      
      // 1. Anyone mentioned directly will 100% respond
      for (const agent of activeRoom.members) {
        const name = agent.name.toLowerCase();
        if (combinedText.includes(`@${name}`) || new RegExp(`\\b${name}\\b`).test(combinedText)) {
          respondingAgents.push(agent);
        }
      }

      // 2. If no one is mentioned, pick at least one random agent to guarantee a reply
      if (respondingAgents.length === 0 && activeRoom.members.length > 0) {
        const randomAgent = activeRoom.members[Math.floor(Math.random() * activeRoom.members.length)];
        respondingAgents.push(randomAgent);
      }

      // 3. For the rest, give them a chance to chime in (e.g., 30% chance in group chats)
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

      // Call API for all responding agents concurrently
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
          }).catch(e => null) // Ignore individual failures so one crash doesn't break all
        );

        const results = await Promise.all(fetchPromises);
        
        // Collect all messages from all responding agents
        let allReturnedMessages: any[] = [];
        for (const data of results) {
          if (data && data.messages && Array.isArray(data.messages)) {
            allReturnedMessages = allReturnedMessages.concat(data.messages);
          }
        }

        if (allReturnedMessages.length === 0) {
          setIsCurrentlyTyping(null);
        }
        
        // Handle multi-bubble queue sequentially so they appear naturally
        for (let i = 0; i < allReturnedMessages.length; i++) {
          const msg = allReturnedMessages[i];
          
          setIsCurrentlyTyping(activeRoom.type === "group" ? `${msg.agentName || 'AI'} is typing` : "typing");
          
          // Realistic typing delay
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

          setMessages(prev => [...prev, optAiMsg]);
          
          // Small pause between multiple bubbles
          if (i < allReturnedMessages.length - 1) {
            await new Promise(r => setTimeout(r, 400));
          }
        }
      } catch (error) {
        console.error("Chat API Error:", error);
        alert("Failed to send message to AI.");
        setIsCurrentlyTyping(null);
      }
    }, 3000); // 3 seconds debounce
  };

  return {
    messages,
    inputValue,
    setInputValue,
    isCurrentlyTyping,
    handleSendMessage
  };
}
