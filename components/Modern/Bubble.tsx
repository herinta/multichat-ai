import { ReactNode } from "react";

interface BubbleProps {
  sender: string;
  content: ReactNode;
  isSelf: boolean;
  replyToContent?: ReactNode;
  theme?: string;
  onPlaySpeech?: () => void;
  isPlayingSpeech?: boolean;
  onPinMessage?: () => void;
  isPinned?: boolean;
}

export function Bubble({
  sender,
  content,
  isSelf,
  replyToContent,
  theme = "default",
  onPlaySpeech,
  isPlayingSpeech = false,
  onPinMessage,
  isPinned = false
}: BubbleProps) {
  return (
    <div className={`group flex w-full mb-4 ${isSelf ? 'justify-end' : 'justify-start'}`}>
      <div className="flex flex-col max-w-[85%] md:max-w-[70%]">
        <div className="flex items-center justify-between mb-1 ml-1 mr-1 text-xs font-medium text-gray-500">
          {!isSelf ? <span>{sender}</span> : <span />}
          {isPinned && (
            <span className="flex items-center gap-1 text-[11px] text-amber-500 font-semibold bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700/50">
              📌 Tersemat
            </span>
          )}
        </div>
        
        <div className={`
          px-4 py-3 shadow-sm relative text-sm leading-relaxed
          ${theme === 'dark-neon' 
            ? (isSelf 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl rounded-br-sm' 
                : 'bg-gray-800 text-gray-100 rounded-2xl rounded-bl-sm border border-gray-700')
            : theme === 'soft-pastel'
            ? (isSelf
                ? 'bg-[#a8e6cf] text-emerald-900 rounded-2xl rounded-br-sm shadow-none'
                : 'bg-[#fff3e0] text-amber-900 rounded-2xl rounded-bl-sm border border-[#ffe0b2] shadow-none')
            : (isSelf 
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl rounded-br-sm' 
                : 'bg-white text-gray-800 rounded-2xl rounded-bl-sm border border-gray-100')
          }
        `}>
          {replyToContent && (
            <div className={`mb-2 px-3 py-2 rounded-lg border-l-4 text-xs opacity-90 line-clamp-3 ${isSelf ? 'bg-black/10 border-white/40 text-white/90' : 'bg-gray-50 border-gray-300 text-gray-600'}`}>
              {replyToContent}
            </div>
          )}
          {content}

          {/* Action Toolbar on Bubble (TTS & Pin) */}
          <div className="flex items-center justify-end gap-1.5 mt-2 pt-1 border-t border-black/5 dark:border-white/5 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            {onPlaySpeech && !isSelf && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPlaySpeech();
                }}
                title={isPlayingSpeech ? "Hentikan Suara" : "Dengarkan Pesan Ini (Suara AI)"}
                className={`p-1 rounded-md text-xs flex items-center gap-1 transition-all ${
                  isPlayingSpeech
                    ? 'bg-blue-500 text-white animate-pulse shadow-sm'
                    : 'text-gray-400 hover:text-blue-500 hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                {isPlayingSpeech ? (
                  <>
                    <span className="w-2.5 h-2.5 bg-white rounded-xs inline-block" />
                    <span className="text-[10px] font-semibold pr-1">Stop</span>
                  </>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )}
              </button>
            )}

            {onPinMessage && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPinMessage();
                }}
                title={isPinned ? "Lepas Sematan (Unpin)" : "Sematkan Pesan Ini (Pin)"}
                className={`p-1 rounded-md text-xs transition-all ${
                  isPinned
                    ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/60'
                    : 'text-gray-400 hover:text-amber-500 hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill={isPinned ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

