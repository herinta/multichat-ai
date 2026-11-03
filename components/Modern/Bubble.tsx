import { ReactNode } from "react";

interface BubbleProps {
  sender: string;
  content: ReactNode;
  isSelf: boolean;
  timestamp?: string;
  showSenderName?: boolean;
  isFirstInGroup?: boolean;
  isLastInGroup?: boolean;
  replyToContent?: ReactNode;
  theme?: string;
  onPinMessage?: () => void;
  isPinned?: boolean;
}

export function Bubble({
  sender,
  content,
  isSelf,
  timestamp,
  showSenderName = true,
  isFirstInGroup = true,
  isLastInGroup = true,
  replyToContent,
  theme = "default",
  onPinMessage,
  isPinned = false
}: BubbleProps) {
  // Determine corner roundings based on sequence
  let roundingClass = "";
  if (isSelf) {
    if (isFirstInGroup && isLastInGroup) {
      roundingClass = "rounded-2xl rounded-br-xs";
    } else if (isFirstInGroup && !isLastInGroup) {
      roundingClass = "rounded-2xl rounded-br-md";
    } else if (!isFirstInGroup && !isLastInGroup) {
      roundingClass = "rounded-2xl rounded-r-md";
    } else {
      // !isFirstInGroup && isLastInGroup
      roundingClass = "rounded-2xl rounded-tr-md rounded-br-xs";
    }
  } else {
    if (isFirstInGroup && isLastInGroup) {
      roundingClass = "rounded-2xl rounded-bl-xs";
    } else if (isFirstInGroup && !isLastInGroup) {
      roundingClass = "rounded-2xl rounded-bl-md";
    } else if (!isFirstInGroup && !isLastInGroup) {
      roundingClass = "rounded-2xl rounded-l-md";
    } else {
      // !isFirstInGroup && isLastInGroup
      roundingClass = "rounded-2xl rounded-tl-md rounded-bl-xs";
    }
  }

  return (
    <div className={`group flex w-full ${isSelf ? 'justify-end' : 'justify-start'} ${isFirstInGroup ? 'mt-2.5' : 'mt-1'} mb-0.5`}>
      <div className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'} max-w-[85%] md:max-w-[70%]`}>
        
        {/* Name Header - ONLY shown on the FIRST message in a sequence for other senders */}
        {(showSenderName || isPinned) && (
          <div className="flex items-center justify-between mb-1 ml-1 mr-1 text-xs w-full">
            {showSenderName && !isSelf ? (
              <span className="font-bold text-blue-600 dark:text-blue-400 text-[11px] tracking-tight">
                {sender}
              </span>
            ) : (
              <span />
            )}
            {isPinned && (
              <span className="flex items-center gap-1 text-[10px] text-amber-500 font-semibold bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700/50 ml-auto">
                📌 Tersemat
              </span>
            )}
          </div>
        )}
        
        <div className={`
          px-3.5 py-2 shadow-xs relative text-sm leading-relaxed w-fit max-w-full ${roundingClass}
          ${theme === 'dark-neon' 
            ? (isSelf 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                : 'bg-gray-800 text-gray-100 border border-gray-700')
            : theme === 'soft-pastel'
            ? (isSelf
                ? 'bg-[#a8e6cf] text-emerald-900 shadow-none'
                : 'bg-[#fff3e0] text-amber-900 border border-[#ffe0b2] shadow-none')
            : (isSelf 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' 
                : 'bg-white text-gray-800 border border-gray-100 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700/80')
          }
        `}>
          {replyToContent && (
            <div className={`mb-1.5 px-3 py-1 rounded-lg border-l-4 text-xs opacity-90 line-clamp-3 ${isSelf ? 'bg-black/15 border-white/50 text-white/90' : 'bg-gray-100 dark:bg-gray-700 border-blue-400 text-gray-700 dark:text-gray-300'}`}>
              {replyToContent}
            </div>
          )}

          {/* Message content & Right-aligned timestamp */}
          <div className="flex flex-col min-w-0">
            <div className="break-words">{content}</div>

            <div className="flex items-center justify-end gap-1 shrink-0 self-end ml-auto select-none pt-1">
              {timestamp && (
                <span className={`text-[10px] leading-none font-medium ${isSelf ? 'text-blue-100/80' : 'text-gray-400 dark:text-gray-400'}`}>
                  {timestamp}
                </span>
              )}
              {isSelf && (
                <span className="text-[11px] leading-none font-bold tracking-tighter text-blue-100/90 ml-0.5" title="Terkirim">
                  ✓✓
                </span>
              )}

              {/* Pin action button on hover */}
              {onPinMessage && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPinMessage();
                  }}
                  title={isPinned ? "Lepas Sematan (Unpin)" : "Sematkan Pesan Ini (Pin)"}
                  className={`p-0.5 rounded text-xs transition-opacity opacity-0 group-hover:opacity-100 ml-0.5 ${
                    isPinned
                      ? 'text-amber-400 opacity-100'
                      : isSelf
                      ? 'text-white/70 hover:text-white'
                      : 'text-gray-400 hover:text-amber-500'
                  }`}
                >
                  <svg className="w-3 h-3" fill={isPinned ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

