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

interface UseVoiceCallOptions {
  onCallEnded?: (summary: string) => void;
}

export function useVoiceCall(options: UseVoiceCallOptions = {}) {
  const [isCallActive, setIsCallActive] = useState(false);
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

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const isCallActiveRef = useRef(false);
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

  // Call timer interval
  useEffect(() => {
    let timer: any = null;
    if (isCallActive) {
      timer = setInterval(() => {
        setDurationSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setDurationSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isCallActive]);

  // Initialize SpeechSynthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Speak AI text using Web Speech Synthesis with per-agent pitch/rate tuning
  const speakAiTurn = useCallback((agent: Agent, text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!synthRef.current || isDeafenedRef.current || !isCallActiveRef.current) {
        resolve();
        return;
      }

      // Stop recognition while AI speaks to avoid microphone feedback
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
      }

      isAiSpeakingRef.current = true;
      setActiveSpeakerId(agent.id);
      setCurrentSubtitle({ speakerName: agent.name, text });

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';

      // Pick Indonesian voice if available
      const voices = synthRef.current.getVoices();
      const idVoice = voices.find(v => v.lang.startsWith('id') || v.lang.includes('ID'));
      if (idVoice) {
        utterance.voice = idVoice;
      }

      // Modulate voice pitch and rate based on agent's name hash
      const charSum = agent.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const pitchVariance = (charSum % 5) * 0.08; // 0.00 to 0.32
      const isHigherVoice = charSum % 2 === 0;
      utterance.pitch = isHigherVoice ? 1.05 + pitchVariance : 0.9 - (pitchVariance * 0.5);
      utterance.rate = 1.02;

      utterance.onend = () => {
        isAiSpeakingRef.current = false;
        setActiveSpeakerId(null);
        setTimeout(() => {
          if (!isAiSpeakingRef.current) {
            setCurrentSubtitle(null);
          }
          // Resume speech recognition after AI finishes speaking
          startListening();
          resolve();
        }, 400);
      };

      utterance.onerror = (e) => {
        console.warn("TTS error or cancelled:", e);
        isAiSpeakingRef.current = false;
        setActiveSpeakerId(null);
        setCurrentSubtitle(null);
        startListening();
        resolve();
      };

      synthRef.current.speak(utterance);
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

        // Speak the text
        await speakAiTurn(data.agent, data.text);

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

    // Mobile Audio Warmup: unlock audio playback on direct user click gesture for iOS/Android
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume();
        const silentUnlock = new SpeechSynthesisUtterance('');
        window.speechSynthesis.speak(silentUnlock);
      } catch (_) {}
    }

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

    // Initial greeting from one of the agents after 1 second
    setTimeout(() => {
      if (isCallActiveRef.current && room.members.length > 0) {
        const firstAgent = room.members[0];
        // Trigger initial pickup greeting
        requestAiTurn("", firstAgent.id);
      } else {
        startListening();
      }
    }, 1000);
  }, [requestAiTurn, startListening]);

  // End Call
  const endCall = useCallback(async () => {
    if (!isCallActiveRef.current) return;
    setIsEndingCall(true);
    isEndingCallRef.current = true;

    // Stop recognition & synthesis
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (_) {}
    }
    if (synthRef.current) {
      synthRef.current.cancel();
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
      if (next && synthRef.current) {
        synthRef.current.cancel();
        setActiveSpeakerId(null);
        setCurrentSubtitle(null);
      }
      return next;
    });
  }, []);

  return {
    isCallActive,
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
