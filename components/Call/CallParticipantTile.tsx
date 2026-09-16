import React from 'react';
import { CallParticipant } from '@/hooks/useVoiceCall';

interface CallParticipantTileProps {
  participant: CallParticipant;
  isSpeaking: boolean;
  isAiThinking?: boolean;
}

export function CallParticipantTile({ participant, isSpeaking, isAiThinking = false }: CallParticipantTileProps) {
  return (
    <div className={`relative flex flex-col items-center justify-center p-6 rounded-3xl transition-all duration-300 ${
      isSpeaking
        ? 'bg-emerald-500/10 border-2 border-emerald-400/80 shadow-[0_0_30px_rgba(52,211,153,0.25)]'
        : 'bg-white/5 border border-white/10 hover:border-white/20'
    } backdrop-blur-md`}>
      
      {/* Avatar Container with Active Speaker Pulse */}
      <div className="relative mb-4">
        {isSpeaking && (
          <>
            <span className="absolute -inset-2 rounded-full bg-emerald-500/30 animate-ping" />
            <span className="absolute -inset-1 rounded-full bg-emerald-400/40 animate-pulse" />
          </>
        )}

        <div className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden flex items-center justify-center bg-gray-800 transition-transform duration-200 ${
          isSpeaking ? 'scale-105 ring-4 ring-emerald-400' : 'ring-2 ring-white/10'
        }`}>
          {participant.avatar_url ? (
            <img
              src={participant.avatar_url}
              alt={participant.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-3xl font-bold uppercase">
              {participant.name.slice(0, 2)}
            </div>
          )}

          {/* AI Thinking Spinner overlay */}
          {participant.isAi && isAiThinking && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Mute badge for user */}
        {!participant.isAi && participant.isMuted && (
          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          </div>
        )}
      </div>

      {/* Name and Role */}
      <div className="flex items-center gap-2">
        <span className="text-white font-medium text-base truncate max-w-[140px] sm:max-w-[180px]">
          {participant.name}
        </span>
        {participant.isAi ? (
          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-blue-500/30 text-blue-300 border border-blue-400/30 rounded-full">
            AI
          </span>
        ) : (
          <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 rounded-full">
            Anda
          </span>
        )}
      </div>

      {/* Live Speaking Audio Waves Indicator */}
      <div className="h-4 flex items-center justify-center gap-1 mt-2">
        {isSpeaking ? (
          <>
            <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_0.6s_infinite_100ms] h-3" />
            <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_0.6s_infinite_200ms] h-4" />
            <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_0.6s_infinite_300ms] h-2" />
            <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_0.6s_infinite_150ms] h-4" />
            <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_0.6s_infinite_250ms] h-3" />
          </>
        ) : (
          <span className="text-xs text-gray-400">
            {participant.isAi && isAiThinking ? "Sedang berpikir..." : "Diam"}
          </span>
        )}
      </div>

    </div>
  );
}
