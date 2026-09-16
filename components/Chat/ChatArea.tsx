"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { Room, Message } from "@/types/chat";
import { Button } from "@/components/Modern/Button";
import { Bubble } from "@/components/Modern/Bubble";
import { useToast } from "@/components/Modern/Toast";
import { useTypewriter } from "@/hooks/useTypewriter";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

// --- Helper to clean text for speech synthesis ---
function cleanTextForSpeech(rawText: string): string {
  return rawText
    .replace(/^\[REPLY:"[^"]+"\]\s*/i, '')
    .replace(/\[IMAGE:[^\]]+\]/gi, 'gambar terlampir')
    .replace(/```[\s\S]*?```/g, 'ada kode program terlampir')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/https?:\/\/\S+/g, 'tautan web')
    .replace(/[*_~#\[\]]/g, '')
    .replace(/[😂😭💀😊🔥✨🎉❤️👍]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// --- MessageItem Sub-component ---
interface MessageItemProps {
  msg: Message;
  isNewest: boolean;
  theme?: string;
  isPlayingSpeech: boolean;
  onPlaySpeech: () => void;
  isPinned: boolean;
  onPinMessage: () => void;
  isSearchMatch?: boolean;
}

function MessageItem({
  msg,
  isNewest,
  theme,
  isPlayingSpeech,
  onPlaySpeech,
  isPinned,
  onPinMessage,
  isSearchMatch = false
}: MessageItemProps) {
  const replyMatch = msg.content.match(/^\[REPLY:"([^"]+)"\]\s*([\s\S]*)$/i);
  const replyToContent = replyMatch ? replyMatch[1] : null;
  const actualContent = replyMatch ? replyMatch[2] : msg.content;

  // Check if it's a Call Session summary message
  if (msg.sender_type === "SYSTEM" || msg.content.includes('"type":"CALL_SESSION"')) {
    try {
      const callData = JSON.parse(msg.content);
      if (callData.type === 'CALL_SESSION') {
        const m = Math.floor((callData.duration || 0) / 60);
        const s = (callData.duration || 0) % 60;
        const durationStr = `${m > 0 ? `${m}m ` : ''}${s}d`;

        return (
          <div id={`msg-${msg.id}`} className="flex justify-center my-4 w-full scroll-mt-24">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 max-w-md w-full shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <span>Panggilan Suara Berakhir</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold">{durationStr}</span>
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(msg.created_at).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-700 dark:text-gray-300 italic mb-2">
                "{callData.summary}"
              </p>
              {callData.transcript && callData.transcript.length > 0 && (
                <details className="mt-2 text-xs text-gray-500 cursor-pointer">
                  <summary className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline select-none">
                    Lihat Transkrip Obrolan ({callData.transcript.length} percakapan)
                  </summary>
                  <div className="mt-2 max-h-40 overflow-y-auto space-y-1 bg-black/5 dark:bg-white/5 p-2 rounded-lg text-[11px]">
                    {callData.transcript.map((t: any, idx: number) => (
                      <div key={idx}>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">[{t.speakerName}]:</span> {t.text}
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </div>
        );
      }
    } catch (_) {}
  }

  const { displayedText, isTyping } = useTypewriter(actualContent, 15);
  const isSelf = msg.sender_type === "USER";
  const textToShow = (isNewest && !isSelf) ? displayedText : actualContent;

  // Check if it's an image message from /imagine
  const imagineMatch = msg.content.match(/^\[IMAGE:(.+)\]$/);
  if (imagineMatch) {
    return (
      <div id={`msg-${msg.id}`} className="scroll-mt-24">
        <Bubble
          sender={isSelf ? "You" : (msg.senderName || "AI")}
          isSelf={isSelf}
          theme={theme}
          onPinMessage={onPinMessage}
          isPinned={isPinned}
          content={
            <div className="relative">
              <img
                src={imagineMatch[1]}
                alt="AI Generated Image"
                className="rounded-xl max-w-full max-h-80 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <p className="text-xs opacity-60 mt-1">🎨 AI Generated Image</p>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div id={`msg-${msg.id}`} className={`scroll-mt-24 rounded-2xl transition-all ${isSearchMatch ? 'ring-2 ring-yellow-400 bg-yellow-400/10' : ''}`}>
      <Bubble
        sender={isSelf ? "You" : (msg.senderName || "AI")}
        isSelf={isSelf}
        replyToContent={replyToContent}
        theme={theme}
        onPlaySpeech={onPlaySpeech}
        isPlayingSpeech={isPlayingSpeech}
        onPinMessage={onPinMessage}
        isPinned={isPinned}
        content={
          isSelf ? (
            // User messages: plain text
            <div className="whitespace-pre-wrap">{textToShow}</div>
          ) : (
            // AI messages: Markdown rendered
            <div className="prose prose-sm max-w-none prose-p:my-1 prose-pre:p-0 prose-pre:my-2">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const isBlock = !props.inline && match;
                    return isBlock ? (
                      <SyntaxHighlighter
                        style={oneDark as any}
                        language={match[1]}
                        PreTag="div"
                        className="rounded-lg text-xs"
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className="bg-black/10 px-1 py-0.5 rounded text-xs font-mono" {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {textToShow}
              </ReactMarkdown>
              {isTyping && isNewest && !isSelf && (
                <span className="inline-block w-1.5 h-4 bg-gray-400 ml-1 align-middle animate-pulse" />
              )}
            </div>
          )
        }
      />
    </div>
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
  onSendMessage: (e: React.FormEvent | string) => void;
  onToggleInfoPanel: () => void;
  onTriggerProactive?: () => void;
  isCheckingProactive?: boolean;
  onStartCall?: () => void;
}

export function ChatArea({
  activeRoom,
  messages,
  isCurrentlyTyping,
  inputValue,
  isInfoOpen,
  onInputChange,
  onSendMessage,
  onToggleInfoPanel,
  onTriggerProactive,
  isCheckingProactive,
  onStartCall
}: ChatAreaProps) {
  const toast = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // --- TTS State ---
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  // --- Pinned Message State ---
  const [pinnedMessageId, setPinnedMessageId] = useState<string | null>(null);

  // --- In-Chat Search State ---
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Sync Pinned Message with LocalStorage per room
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`pinned_msg_${activeRoom.id}`);
      setPinnedMessageId(saved);
    }
  }, [activeRoom.id]);

  const handleTogglePin = useCallback((msgId: string) => {
    setPinnedMessageId(prev => {
      const next = prev === msgId ? null : msgId;
      if (next) {
        localStorage.setItem(`pinned_msg_${activeRoom.id}`, next);
        toast.info("Pesan berhasil disematkan!");
      } else {
        localStorage.removeItem(`pinned_msg_${activeRoom.id}`);
        toast.info("Sematan pesan dilepas.");
      }
      return next;
    });
  }, [activeRoom.id, toast]);

  // Handle TTS Playback for individual messages
  const handleToggleSpeech = useCallback((msgId: string, text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("Browser Anda tidak mendukung Text-to-Speech.");
      return;
    }

    if (playingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setPlayingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = cleanTextForSpeech(text);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "id-ID";

    const voices = window.speechSynthesis.getVoices();
    const idVoice = voices.find(v => v.lang.startsWith("id") || v.lang.includes("ID"));
    if (idVoice) utterance.voice = idVoice;

    utterance.onend = () => setPlayingMessageId(null);
    utterance.onerror = () => setPlayingMessageId(null);

    setPlayingMessageId(msgId);
    window.speechSynthesis.speak(utterance);
  }, [playingMessageId]);

  // Stop speech when switching rooms
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setPlayingMessageId(null);
    }
  }, [activeRoom.id]);

  useEffect(() => {
    if (!isSearchOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isCurrentlyTyping, isSearchOpen]);

  // Search matches
  const matchingMessageIds = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    const q = searchQuery.toLowerCase();
    return new Set(messages.filter(m => m.content.toLowerCase().includes(q)).map(m => m.id));
  }, [messages, searchQuery]);

  // Find pinned message object
  const pinnedMessage = useMemo(() => {
    if (!pinnedMessageId) return null;
    return messages.find(m => m.id === pinnedMessageId) || null;
  }, [messages, pinnedMessageId]);

  // --- Export Chat ---
  const handleExportChat = useCallback(() => {
    const lines = messages.map(m => {
      const sender = m.senderName || (m.sender_type === "USER" ? "You" : "AI");
      const time = new Date(m.created_at).toLocaleString("id-ID");
      return `[${time}] ${sender}: ${m.content}`;
    });
    const content = `Chat: ${activeRoom.title}\nExported: ${new Date().toLocaleString("id-ID")}\n\n${lines.join("\n")}`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-${activeRoom.title.replace(/\s+/g, '-')}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Riwayat chat berhasil diexport!");
  }, [messages, activeRoom, toast]);

  // --- Voice Input ---
  const handleToggleVoice = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      toast.error("Browser Anda tidak mendukung Voice Input.");
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "id-ID";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onInputChange(transcript);
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [isRecording, onInputChange]);

  const scrollToMessage = (msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <main className={`flex-1 flex flex-col min-w-0 relative bg-blend-overlay ${
      activeRoom.theme === 'dark-neon'
        ? "bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] bg-gray-900/95 text-gray-100"
        : activeRoom.theme === 'soft-pastel'
        ? "bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] bg-[#fffbf0]/90 text-gray-800"
        : "bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-gray-50/90 text-gray-800"
    }`}>
      
      {/* Top Header */}
      <header className="h-[72px] border-b border-gray-200 dark:border-gray-800 px-6 flex items-center justify-between shrink-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-10 sticky top-0 shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-inner shrink-0 ${activeRoom.type === 'group' ? 'bg-gradient-to-br from-indigo-400 to-purple-500' : 'bg-gradient-to-br from-blue-400 to-cyan-500'}`}>
            {activeRoom.title.substring(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-gray-900 dark:text-gray-100 truncate">
              {activeRoom.title}
            </h2>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Online</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          
          {/* Voice Call Button */}
          {onStartCall && (
            <button
              onClick={onStartCall}
              title={activeRoom.type === 'group' ? "Mulai Panggilan Suara Grup" : "Telepon Suara Karakter Ini"}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700/60 rounded-full transition-all shadow-sm active:scale-95"
            >
              <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>{activeRoom.type === 'group' ? "Call Grup" : "Telepon"}</span>
            </button>
          )}

          {/* Proactive / Chat Duluan Trigger */}
          {onTriggerProactive && (
            <button
              onClick={onTriggerProactive}
              disabled={isCheckingProactive}
              title="Minta karakter memulai percakapan spontan (chat duluan)"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 rounded-full transition-all disabled:opacity-50 shadow-sm"
            >
              <span>{isCheckingProactive ? "⏳" : "✨"}</span>
              <span className="hidden sm:inline">{isCheckingProactive ? "Memikirkan..." : "Chat Duluan"}</span>
            </button>
          )}

          {/* Search Messages in Room */}
          <button
            onClick={() => {
              setIsSearchOpen(!isSearchOpen);
              if (isSearchOpen) setSearchQuery("");
            }}
            title={isSearchOpen ? "Tutup Pencarian" : "Cari Pesan"}
            className={`p-2 rounded-full transition-all ${isSearchOpen ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* Export Chat */}
          <button
            onClick={handleExportChat}
            title="Export Chat"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>

          <Button
            variant="secondary"
            onClick={onToggleInfoPanel}
            className="rounded-full px-4"
          >
            {isInfoOpen ? "Close Info" : "Info"}
          </Button>
        </div>
      </header>

      {/* In-Chat Search Bar Banner */}
      {isSearchOpen && (
        <div className="px-6 py-2.5 bg-blue-50/90 dark:bg-gray-850/90 border-b border-blue-100 dark:border-gray-800 flex items-center justify-between gap-3 animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kata atau topik di chat ini..."
              autoFocus
              className="w-full bg-transparent border-none text-xs focus:outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {searchQuery && (
              <span>{matchingMessageIds.size} ditemukan</span>
            )}
            <button
              onClick={() => {
                setIsSearchOpen(false);
                setSearchQuery("");
              }}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Pinned Message Sticky Banner */}
      {pinnedMessage && (
        <div className="px-6 py-2 bg-amber-50/90 dark:bg-amber-950/40 border-b border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 animate-in slide-in-from-top duration-200 z-5">
          <div 
            onClick={() => scrollToMessage(pinnedMessage.id)}
            className="flex items-center gap-2 min-w-0 cursor-pointer hover:underline flex-1"
            title="Klik untuk loncat ke pesan tersemat"
          >
            <span className="font-bold">📌 Pesan Tersemat:</span>
            <span className="truncate max-w-xl italic opacity-90">
              [{pinnedMessage.senderName || (pinnedMessage.sender_type === 'USER' ? 'You' : 'AI')}]: {pinnedMessage.content}
            </span>
          </div>
          <button
            onClick={() => handleTogglePin(pinnedMessage.id)}
            title="Lepas Sematan (Unpin)"
            className="text-amber-600 hover:text-amber-800 dark:text-amber-400 text-xs px-2 py-0.5 rounded hover:bg-amber-100 dark:hover:bg-amber-900/60 font-medium"
          >
            Lepas Sematan
          </button>
        </div>
      )}

      {/* Messages List Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col">
        <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto">
          {messages.map((msg, idx) => {
            const isMatch = matchingMessageIds.has(msg.id);
            return (
              <MessageItem
                key={msg.id}
                msg={msg}
                isNewest={idx === messages.length - 1}
                theme={activeRoom.theme}
                isPlayingSpeech={playingMessageId === msg.id}
                onPlaySpeech={() => handleToggleSpeech(msg.id, msg.content)}
                isPinned={pinnedMessageId === msg.id}
                onPinMessage={() => handleTogglePin(msg.id)}
                isSearchMatch={isMatch}
              />
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Bar */}
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
          <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2.5 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-300 transition-all">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputValue}
                maxLength={4000}
                onChange={(e) => onInputChange(e.target.value)}
                placeholder={isRecording ? "🎤 Mendengarkan..." : "Ketik pesan atau /imagine [deskripsi]..."}
                className="flex-1 bg-transparent border-none text-sm focus:outline-none text-gray-800 dark:text-gray-100 placeholder:text-gray-400"
                autoComplete="off"
              />
              
              {/* Voice Input Button */}
              <button
                type="button"
                onClick={handleToggleVoice}
                title="Voice Input"
                className={`p-1 rounded-full transition-all ${isRecording ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <svg className="w-5 h-5" fill={isRecording ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
            </div>

            {/* Character length warning if typing very long input */}
            {inputValue.length > 3500 && (
              <div className="text-[10px] text-gray-400 text-right mt-1">
                {inputValue.length} / 4000 karakter
              </div>
            )}
          </div>

          <Button type="submit" variant="primary" disabled={!inputValue.trim()} className="rounded-2xl px-6 h-[46px] flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 -mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </Button>
        </form>
      </div>
    </main>
  );
}
