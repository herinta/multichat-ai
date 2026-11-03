import { useState, useEffect, useRef, useCallback } from 'react';
import { Room, Agent } from '@/types/chat';

export interface CallParticipant {
  id: string;
  name: string;
  avatar_url?: string;
  isAi: boolean;
  isSpeaking: boolean;
  isMuted?: boolean;
}

export interface CallTurn {
  speakerId: string;
  speakerName: string;
  text: string;
  timestamp: number;
}

// Web Audio API Ringtone Generator for realistic outgoing phone call sound
class OutgoingRingtonePlayer {
  private audioCtx: AudioContext | null = null;
  private intervalId: any = null;
  private isPlaying = false;

  start() {
    if (typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      this.audioCtx = new AudioContextClass();
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      this.isPlaying = true;

      // Play first ring instantly
      this.playSingleRing();

      // Repeat ring tone every 3.2 seconds (1.2s ring tone + 2.0s silence)
      this.intervalId = setInterval(() => {
        if (!this.isPlaying) return;
        this.playSingleRing();
      }, 3200);
    } catch (e) {
      console.warn('Outgoing ringtone init failed:', e);
    }
  }

  private playSingleRing() {
    if (!this.audioCtx || !this.isPlaying) return;
    try {
      const ctx = this.audioCtx;
      const now = ctx.currentTime;

      // Dual-frequency harmonic sine waves (440Hz + 480Hz) for authentic dial tone
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(440, now);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(480, now);

      // Smooth attack and release envelope
      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.exponentialRampToValueAtTime(0.12, now + 0.08);
      gainNode.gain.setValueAtTime(0.12, now + 1.15);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.25);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);

      osc1.stop(now + 1.3);
      osc2.stop(now + 1.3);
    } catch (e) {
      console.warn('Ring pulse failed:', e);
    }
  }

  stop() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.audioCtx) {
      try {
        this.audioCtx.close();
      } catch (_) {}
      this.audioCtx = null;
    }
  }
}

function playPickupChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.15, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
    setTimeout(() => {
      try { ctx.close(); } catch (_) {}
    }, 350);
  } catch (_) {}
}

interface UseVoiceCallOptions {
  onCallEnded?: (summary: string) => void;
}

export function useVoiceCall(options: UseVoiceCallOptions = {}) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<CallParticipant[]>([]);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [currentSubtitle, setCurrentSubtitle] = useState<{ speakerName: string; text: string } | null>(null);
  const [transcript, setTranscript] = useState<CallTurn[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isEndingCall, setIsEndingCall] = useState(false);

  const ringtonePlayerRef = useRef<OutgoingRingtonePlayer | null>(null);
  const ringingTimeoutRef = useRef<any>(null);
  const aiSpeakingTimeoutRef = useRef<any>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const isCallActiveRef = useRef(false);
  const isRingingRef = useRef(false);
  const isMicMutedRef = useRef(false);
  const isDeafenedRef = useRef(false);
  const isAiSpeakingRef = useRef(false);
  const transcriptRef = useRef<CallTurn[]>([]);
  const activeRoomRef = useRef<Room | null>(null);
  const consecutiveAiTurnsRef = useRef(0);
  const isEndingCallRef = useRef(false);

  // Keep refs synced with state
  useEffect(() => {
    isCallActiveRef.current = isCallActive;
  }, [isCallActive]);

  useEffect(() => {
    isRingingRef.current = isRinging;
  }, [isRinging]);

  useEffect(() => {
    isMicMutedRef.current = isMicMuted;
  }, [isMicMuted]);

  useEffect(() => {
    isDeafenedRef.current = isDeafened;
  }, [isDeafened]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  // Call timer interval (only increments once call is answered and !isRinging)
  useEffect(() => {
    let timer: any = null;
    if (isCallActive && !isRinging) {
      timer = setInterval(() => {
        setDurationSeconds(prev => prev + 1);
      }, 1000);
    } else if (!isCallActive) {
      setDurationSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isCallActive, isRinging]);

  // AI turn handling (Native Gemini Voice Audio Playback + Subtitles)
  const speakAiTurn = useCallback((agent: Agent, text: string, audioBase64?: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!isCallActiveRef.current || isEndingCallRef.current) {
        resolve();
        return;
      }

      // Stop mic recognition while AI speaks to avoid microphone feedback
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
      }

      if (aiSpeakingTimeoutRef.current) {
        clearTimeout(aiSpeakingTimeoutRef.current);
        aiSpeakingTimeoutRef.current = null;
      }

      if (activeAudioRef.current) {
        try {
          activeAudioRef.current.pause();
          activeAudioRef.current = null;
        } catch (_) {}
      }

      isAiSpeakingRef.current = true;
      setActiveSpeakerId(agent.id);
      setCurrentSubtitle({ speakerName: agent.name, text });

      // If authentic Gemini Audio WAV is present and not deafened, play it directly!
      if (audioBase64 && !isDeafenedRef.current) {
        try {
          const audio = new Audio("data:audio/wav;base64," + audioBase64);
          activeAudioRef.current = audio;

          audio.onended = () => {
            isAiSpeakingRef.current = false;
            setActiveSpeakerId(null);
            activeAudioRef.current = null;

            setTimeout(() => {
              if (!isAiSpeakingRef.current) {
                setCurrentSubtitle(null);
              }
              startListening();
              resolve();
            }, 400);
          };

          audio.onerror = (e) => {
            console.warn("Gemini audio playback error, falling back to timed subtitles:", e);
            fallbackTimer();
          };

          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch((err) => {
              console.warn("Audio autoplay blocked or interrupted:", err);
              fallbackTimer();
            });
          }
          return;
        } catch (e) {
          console.warn("Audio init failed:", e);
        }
      }

      // Fallback timer when audio is unavailable or muted/deafened
      function fallbackTimer() {
        const speechDurationMs = Math.min(5500, Math.max(2200, text.length * 65));
        aiSpeakingTimeoutRef.current = setTimeout(() => {
          isAiSpeakingRef.current = false;
          setActiveSpeakerId(null);
          aiSpeakingTimeoutRef.current = null;

          setTimeout(() => {
            if (!isAiSpeakingRef.current) {
              setCurrentSubtitle(null);
            }
            startListening();
            resolve();
          }, 500);
        }, speechDurationMs);
      }

      fallbackTimer();
    });
  }, []);

  // Request an AI conversational turn
  const requestAiTurn = useCallback(async (userText: string = "", forceAgentId?: string) => {
    if (!activeRoomRef.current || !isCallActiveRef.current || isEndingCallRef.current) return;

    setIsAiThinking(true);
    try {
      const response = await fetch('/api/call/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: activeRoomRef.current.id,
          userTranscript: userText,
          activeCallTranscript: transcriptRef.current,
          forceAgentId,
          consecutiveAiTurns: consecutiveAiTurnsRef.current
        })
      });

      if (!response.ok) {
        throw new Error("Failed to get AI call turn");
      }

      const data = await response.json();
      if (!isCallActiveRef.current) return;

      if (data.success && data.agent && data.text) {
        const aiTurn: CallTurn = {
          speakerId: data.agent.id,
          speakerName: data.agent.name,
          text: data.text,
          timestamp: Date.now()
        };

        setTranscript(prev => [...prev, aiTurn]);
        consecutiveAiTurnsRef.current += 1;
        setIsAiThinking(false);

        // Speak the text with native Gemini voice audio
        await speakAiTurn(data.agent, data.text, data.audioBase64);

        // If another AI agent in group call should naturally chime in
        if (data.shouldFollowUp && data.nextSuggestedAgentId && consecutiveAiTurnsRef.current < 2 && isCallActiveRef.current) {
          setTimeout(() => {
            if (isCallActiveRef.current && !isAiSpeakingRef.current) {
              requestAiTurn("", data.nextSuggestedAgentId);
            }
          }, 600);
        }
      }
    } catch (err) {
      console.error("requestAiTurn error:", err);
    } finally {
      setIsAiThinking(false);
    }
  }, [speakAiTurn]);

  // Start browser speech recognition
  const startListening = useCallback(() => {
    if (typeof window === 'undefined' || !isCallActiveRef.current || isMicMutedRef.current || isAiSpeakingRef.current || isEndingCallRef.current) {
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        // Recognition started
      };

      recognition.onresult = (event: any) => {
        if (!isCallActiveRef.current || isMicMutedRef.current || isAiSpeakingRef.current) return;

        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          if (res.isFinal) {
            finalText += res[0].transcript;
          } else {
            interimText += res[0].transcript;
          }
        }

        if (interimText) {
          setActiveSpeakerId('user');
          setCurrentSubtitle({ speakerName: 'Anda', text: interimText });
        }

        if (finalText.trim()) {
          const userSpoken = finalText.trim();
          setActiveSpeakerId('user');
          setCurrentSubtitle({ speakerName: 'Anda', text: userSpoken });

          const newTurn: CallTurn = {
            speakerId: 'user',
            speakerName: 'Anda',
            text: userSpoken,
            timestamp: Date.now()
          };

          setTranscript(prev => [...prev, newTurn]);
          consecutiveAiTurnsRef.current = 0;

          // Request AI reply
          requestAiTurn(userSpoken);
        }
      };

      recognition.onerror = (e: any) => {
        if (e.error !== 'no-speech' && e.error !== 'aborted') {
          console.warn("Speech recognition warning:", e.error);
        }
      };

      recognition.onend = () => {
        // Auto-restart listening if call is still active and AI is not speaking
        if (isCallActiveRef.current && !isMicMutedRef.current && !isAiSpeakingRef.current && !isEndingCallRef.current) {
          try {
            recognition.start();
          } catch (_) {}
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn("Could not start speech recognition:", e);
    }
  }, [requestAiTurn]);

  // Start Call
  const startCall = useCallback((room: Room, currentUser: any) => {
    setActiveRoom(room);
    setIsCallActive(true);
    isCallActiveRef.current = true;
    setIsEndingCall(false);
    isEndingCallRef.current = false;
    setDurationSeconds(0);
    setTranscript([]);
    consecutiveAiTurnsRef.current = 0;

    // Build participants list: User + Room Agents
    const partList: CallParticipant[] = [
      {
        id: 'user',
        name: (currentUser as any)?.email ? (currentUser as any).email.split('@')[0] : 'Anda',
        avatar_url: '',
        isAi: false,
        isSpeaking: false,
        isMuted: false
      },
      ...room.members.map(m => ({
        id: m.id,
        name: m.name,
        avatar_url: m.avatar_url,
        isAi: true,
        isSpeaking: false
      }))
    ];
    setParticipants(partList);

    // Start Ringtone & Ringing status
    setIsRinging(true);
    isRingingRef.current = true;

    // Play outgoing dial ringtone via Web Audio API
    try {
      if (ringtonePlayerRef.current) {
        ringtonePlayerRef.current.stop();
      }
      const ringtone = new OutgoingRingtonePlayer();
      ringtonePlayerRef.current = ringtone;
      ringtone.start();
    } catch (e) {
      console.warn("Could not start ringtone:", e);
    }

    // Clean any previous ringing timeout
    if (ringingTimeoutRef.current) {
      clearTimeout(ringingTimeoutRef.current);
    }

    // Initial greeting from one of the agents after realistic ringing duration (2.6 seconds)
    ringingTimeoutRef.current = setTimeout(() => {
      if (!isCallActiveRef.current) return;

      // Stop ringtone and play pickup chime
      if (ringtonePlayerRef.current) {
        ringtonePlayerRef.current.stop();
        ringtonePlayerRef.current = null;
      }
      setIsRinging(false);
      isRingingRef.current = false;
      playPickupChime();

      if (isCallActiveRef.current && room.members.length > 0) {
        const firstAgent = room.members[0];
        // Trigger initial pickup greeting
        requestAiTurn("", firstAgent.id);
      } else {
        startListening();
      }
    }, 2600);
  }, [requestAiTurn, startListening]);

  // End Call
  const endCall = useCallback(async () => {
    if (!isCallActiveRef.current) return;
    setIsEndingCall(true);
    isEndingCallRef.current = true;

    // Stop ringtone if still ringing
    if (ringtonePlayerRef.current) {
      ringtonePlayerRef.current.stop();
      ringtonePlayerRef.current = null;
    }
    if (ringingTimeoutRef.current) {
      clearTimeout(ringingTimeoutRef.current);
      ringingTimeoutRef.current = null;
    }
    if (activeAudioRef.current) {
      try {
        activeAudioRef.current.pause();
        activeAudioRef.current = null;
      } catch (_) {}
    }
    setIsRinging(false);
    isRingingRef.current = false;
    isAiSpeakingRef.current = false;

    // Stop recognition
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
    }

    const currentDuration = durationSeconds;
    const currentTranscript = [...transcriptRef.current];
    const roomId = activeRoomRef.current?.id;

    setIsCallActive(false);
    isCallActiveRef.current = false;
    setActiveSpeakerId(null);
    setCurrentSubtitle(null);

    // Guard: If call was practically empty (< 3 seconds or no spoken turns), exit cleanly
    if (currentDuration < 3 || currentTranscript.length === 0) {
      setIsEndingCall(false);
      return;
    }

    // Trigger post-call consolidation and message creation in background
    if (roomId && currentTranscript.length > 0) {
      try {
        const res = await fetch('/api/call/end', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId,
            durationSeconds: currentDuration,
            callTranscript: currentTranscript
          })
        });
        const data = await res.json();
        if (data.summary && options.onCallEnded) {
          options.onCallEnded(data.summary);
        }
      } catch (err) {
        console.error("Failed to consolidate call session:", err);
      }
    }

    setIsEndingCall(false);
  }, [durationSeconds, options]);

  // Toggle Mute
  const toggleMicMute = useCallback(() => {
    setIsMicMuted(prev => {
      const next = !prev;
      if (next && recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
      } else if (!next) {
        startListening();
      }
      return next;
    });
  }, [startListening]);

  // Toggle Deafen (Speaker)
  const toggleDeafen = useCallback(() => {
    setIsDeafened(prev => {
      const next = !prev;
      if (next) {
        if (activeAudioRef.current) {
          try {
            activeAudioRef.current.pause();
            activeAudioRef.current = null;
          } catch (_) {}
        }
        if (aiSpeakingTimeoutRef.current) {
          clearTimeout(aiSpeakingTimeoutRef.current);
          aiSpeakingTimeoutRef.current = null;
        }
        isAiSpeakingRef.current = false;
        setActiveSpeakerId(null);
        setCurrentSubtitle(null);
      }
      return next;
    });
  }, []);

  return {
    isCallActive,
    isRinging,
    activeRoom,
    participants,
    durationSeconds,
    isMicMuted,
    isDeafened,
    activeSpeakerId,
    currentSubtitle,
    transcript,
    isAiThinking,
    isEndingCall,
    startCall,
    endCall,
    toggleMicMute,
    toggleDeafen
  };
}
