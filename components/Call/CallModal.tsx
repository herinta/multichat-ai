import React from 'react';
import { CallParticipant, CallTurn } from '@/hooks/useVoiceCall';
import { CallParticipantTile } from './CallParticipantTile';

interface CallModalProps {
  isOpen: boolean;
  roomTitle: string;
  isGroup: boolean;
  participants: CallParticipant[];
  durationSeconds: number;
  activeSpeakerId: string | null;
  currentSubtitle: { speakerName: string; text: string } | null;
  isMicMuted: boolean;
  isDeafened: boolean;
  isAiThinking: boolean;
  isEndingCall: boolean;
  onToggleMic: () => void;
  onToggleDeafen: () => void;
  onEndCall: () => void;
}

export function CallModal({
  isOpen,
  roomTitle,
  isGroup,
  participants,
  durationSeconds,
  activeSpeakerId,
  currentSubtitle,
  isMicMuted,
  isDeafened,
  isAiThinking,
  isEndingCall,
  onToggleMic,
  onToggleDeafen,
  onEndCall
}: CallModalProps) {
  if (!isOpen) return null;

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950/95 backdrop-blur-2xl text-white select-none animate-in fade-in duration-300">
      
      {/* Top Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>{roomTitle}</span>
              {isGroup && (
                <span className="text-xs bg-purple-500/30 text-purple-300 border border-purple-400/30 px-2 py-0.5 rounded-full">
                  Panggilan Grup
                </span>
              )}
            </h2>
            <p className="text-xs text-emerald-400 font-medium">
              Suara Aktif • {formatDuration(durationSeconds)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 hidden sm:inline-block">
            {participants.length} Peserta
          </span>
        </div>
      </header>

      {/* Main Participant Grid */}
      <main className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
        <div className={`w-full max-w-5xl grid gap-4 sm:gap-6 ${
          participants.length <= 2
            ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl'
            : participants.length <= 4
            ? 'grid-cols-2 max-w-3xl'
            : 'grid-cols-2 md:grid-cols-3'
        }`}>
          {participants.map((p) => {
            const isSpeaking = activeSpeakerId === p.id;
            const isParticipantMuted = !p.isAi && isMicMuted;
            return (
              <CallParticipantTile
                key={p.id}
                participant={{ ...p, isMuted: isParticipantMuted }}
                isSpeaking={isSpeaking}
                isAiThinking={p.isAi && isAiThinking && activeSpeakerId === null}
              />
            );
          })}
        </div>
      </main>

      {/* Live Floating Subtitle / Transcript Bar */}
      <div className="px-6 pb-2">
        <div className="max-w-2xl mx-auto min-h-[52px] bg-black/60 border border-white/10 rounded-2xl px-5 py-3 flex items-center justify-center text-center shadow-lg backdrop-blur-md">
          {currentSubtitle ? (
            <p className="text-sm sm:text-base text-gray-100 font-medium leading-relaxed animate-in fade-in">
              <span className="text-emerald-400 font-bold mr-2">[{currentSubtitle.speakerName}]:</span>
              "{currentSubtitle.text}"
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-gray-400 italic">
              {isAiThinking ? "Menunggu respon AI..." : "Mendengarkan... Silakan bicara langsung lewat mikrofon HP/laptop Anda."}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Control Bar */}
      <footer className="px-6 py-6 border-t border-white/10 flex items-center justify-center gap-4 sm:gap-6 bg-black/40 backdrop-blur-md">
        
        {/* Mute Mic Button */}
        <button
          onClick={onToggleMic}
          className={`flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-2xl transition-all duration-200 ${
            isMicMuted
              ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
              : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
          }`}
          title={isMicMuted ? "Aktifkan Mikrofon" : "Bisukan Mikrofon"}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isMicMuted ? 'bg-red-500 text-white' : 'bg-white/10'
          }`}>
            {isMicMuted ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </div>
          <span className="text-[11px] font-medium">
            {isMicMuted ? "Mic Mati" : "Mic Aktif"}
          </span>
        </button>

        {/* Deafen (Speaker Mute) Button */}
        <button
          onClick={onToggleDeafen}
          className={`flex flex-col items-center gap-1.5 px-4 py-2.5 rounded-2xl transition-all duration-200 ${
            isDeafened
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
          }`}
          title={isDeafened ? "Nyalakan Speaker" : "Matikan Suara Speaker"}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isDeafened ? 'bg-amber-500 text-white' : 'bg-white/10'
          }`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isDeafened ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              )}
            </svg>
          </div>
          <span className="text-[11px] font-medium">
            {isDeafened ? "Suara Senyap" : "Speaker Aktif"}
          </span>
        </button>

        {/* End Call Button (Hang up) */}
        <button
          onClick={onEndCall}
          disabled={isEndingCall}
          className="flex flex-col items-center gap-1.5 px-6 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-95 text-white transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)]"
          title="Tutup Panggilan"
        >
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <svg className="w-6 h-6 rotate-135" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
          </div>
          <span className="text-[11px] font-bold">
            {isEndingCall ? "Menutup..." : "Tutup Call"}
          </span>
        </button>

      </footer>

      {/* Ending Call Loading Overlay */}
      {isEndingCall && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-60 animate-in fade-in">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
          <h3 className="text-lg font-bold text-white mb-1">Menutup Panggilan Suara...</h3>
          <p className="text-sm text-gray-400">Merangkum percakapan & memperbarui memori grup...</p>
        </div>
      )}

    </div>
  );
}
