import { useRef, useEffect } from "react";
import { Room, Message } from "@/types/chat";
import { Button } from "@/components/Modern/Button";
import { Bubble } from "@/components/Modern/Bubble";
import { useTypewriter } from "@/hooks/useTypewriter";

// --- MessageItem Sub-component ---
function MessageItem({ msg, isNewest, theme }: { msg: Message; isNewest: boolean; theme?: string }) {
  const replyMatch = msg.content.match(/^\[REPLY:"([^"]+)"\]\s*([\s\S]*)$/i);
  const replyToContent = replyMatch ? replyMatch[1] : null;
  const actualContent = replyMatch ? replyMatch[2] : msg.content;

  const { displayedText, isTyping } = useTypewriter(actualContent, 15);
  const isSelf = msg.sender_type === "USER";
  const textToShow = (isNewest && !isSelf) ? displayedText : actualContent;
  
  return (
    <Bubble 
      sender={isSelf ? "You" : (msg.senderName || "AI")}
      isSelf={isSelf}
      replyToContent={replyToContent}
      theme={theme}
      content={
        <div className="whitespace-pre-wrap">
          {textToShow}
          {isTyping && isNewest && !isSelf && (
            <span className="inline-block w-1.5 h-4 bg-gray-400 ml-1 align-middle animate-pulse"></span>
          )}
        </div>
      }
    />
  );
}

// --- ChatArea Component ---
interface ChatAreaProps {
  activeRoom: Room;
  messages: Message[];
  isCurrentlyTyping: string | null;
  inputValue: string;
  isInfoOpen: boolean;
  onInputChange: (value: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  onToggleInfoPanel: () => void;
}

export function ChatArea({
  activeRoom,
  messages,
  isCurrentlyTyping,
  inputValue,
  isInfoOpen,
  onInputChange,
  onSendMessage,
  onToggleInfoPanel
}: ChatAreaProps) {
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isCurrentlyTyping]);

  return (
    <main className={`flex-1 flex flex-col min-w-0 relative bg-blend-overlay ${
      activeRoom.theme === 'dark-neon'
        ? "bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] bg-gray-900/95"
        : activeRoom.theme === 'soft-pastel'
        ? "bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] bg-[#fffbf0]/90"
        : "bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-50/90"
    }`}>
      <header className="h-[72px] border-b border-gray-200 px-6 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-md z-10 sticky top-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-inner ${activeRoom.type === 'group' ? 'bg-gradient-to-br from-indigo-400 to-purple-500' : 'bg-gradient-to-br from-blue-400 to-cyan-500'}`}>
            {activeRoom.title.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="font-bold text-gray-900 truncate">
              {activeRoom.title}
            </h2>
            <p className="text-xs text-blue-600 font-medium">Online</p>
          </div>
        </div>
        <Button 
          variant="secondary" 
          onClick={onToggleInfoPanel}
          className="rounded-full px-4"
        >
          {isInfoOpen ? "Close Info" : "Info"}
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col">
        <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto">
          {messages.map((msg, idx) => (
            <MessageItem 
              key={msg.id} 
              msg={msg} 
              isNewest={idx === messages.length - 1} 
              theme={activeRoom.theme}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 md:p-6 bg-transparent z-10 pb-6">
        {isCurrentlyTyping && (
          <div className="max-w-4xl w-full mx-auto px-2 mb-2 flex items-center gap-1.5 text-blue-600 text-sm font-medium">
            <span className="animate-pulse">{isCurrentlyTyping}</span>
            <span className="flex gap-0.5 mt-1">
              <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </span>
          </div>
        )}
        <form onSubmit={onSendMessage} className="max-w-4xl w-full mx-auto flex gap-3 items-end">
          <div className="flex-1 flex items-center bg-white border border-gray-200 px-4 py-3 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-transparent border-none text-sm focus:outline-none text-gray-800 placeholder:text-gray-400"
              autoComplete="off"
            />
          </div>
          <Button type="submit" variant="primary" disabled={!inputValue.trim()} className="rounded-2xl px-6 h-[46px] flex items-center justify-center">
            <svg className="w-5 h-5 -mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </Button>
        </form>
      </div>
    </main>
  );
}
