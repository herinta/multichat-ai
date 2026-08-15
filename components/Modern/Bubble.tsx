import { ReactNode } from "react";

interface BubbleProps {
  sender: string;
  content: ReactNode;
  isSelf: boolean;
  replyToContent?: ReactNode;
  theme?: string;
}

export function Bubble({ sender, content, isSelf, replyToContent, theme = "default" }: BubbleProps) {
  return (
    <div className={`flex w-full mb-4 ${isSelf ? 'justify-end' : 'justify-start'}`}>
      <div className="flex flex-col max-w-[85%] md:max-w-[70%]">
        {!isSelf && (
          <div className="text-xs font-medium mb-1 ml-1 text-gray-500">
            {sender}
          </div>
        )}
        
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
        </div>
      </div>
    </div>
  );
}
