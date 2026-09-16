import { useEffect, useRef, useState, useCallback } from "react";
import { useToast } from "@/components/Modern/Toast";

interface ProactiveMessagePayload {
  id: string;
  roomId: string;
  roomTitle: string;
  agentId: string;
  agentName: string;
  content: string;
  createdAt: string;
}

interface UseProactiveChatOptions {
  enabled?: boolean;
  onProactiveMessage?: (roomId: string, message: ProactiveMessagePayload) => void;
}

export function useProactiveChat({
  enabled = true,
  onProactiveMessage
}: UseProactiveChatOptions = {}) {
  const [isChecking, setIsChecking] = useState(false);
  const toast = useToast();
  const tabIdRef = useRef<string>("");

  useEffect(() => {
    // Generate unique tab ID for multi-tab mutex lock
    if (typeof window !== "undefined") {
      let tabId = sessionStorage.getItem("multi_ai_tab_id");
      if (!tabId) {
        tabId = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        sessionStorage.setItem("multi_ai_tab_id", tabId);
      }
      tabIdRef.current = tabId;
    }
  }, []);

  const triggerProactiveNow = useCallback(async (roomId?: string, force = true) => {
    setIsChecking(true);
    try {
      const res = await fetch('/api/chat/proactive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, force })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.triggered && data.message) {
        toast.info(`💬 ${data.message.agentName} baru saja mengirim pesan di "${data.message.roomTitle}"`);
        onProactiveMessage?.(data.message.roomId, data.message);
        return data.message as ProactiveMessagePayload;
      } else if (force) {
        toast.info(data.reason || "Belum ada karakter yang perlu chat saat ini.");
      }
      return null;
    } catch (err) {
      console.error("Proactive chat check failed:", err);
      if (force) {
        toast.error("Gagal memicu chat proaktif. Coba lagi.");
      }
      return null;
    } finally {
      setIsChecking(false);
    }
  }, [toast, onProactiveMessage]);

  // Periodic background check with Multi-Tab Mutex Lock
  useEffect(() => {
    if (!enabled) return;

    const checkEligibilityAndRun = async () => {
      if (typeof window === "undefined") return;

      const now = Date.now();
      const LEADER_KEY = "multi_ai_proactive_leader";
      const LAST_CHECK_KEY = "multi_ai_proactive_last_check";

      // 1. Leader Election check (Mutex lock across browser tabs)
      const currentLeader = localStorage.getItem(LEADER_KEY);
      const leaderTimestamp = parseInt(localStorage.getItem(`${LEADER_KEY}_ts`) || "0", 10);
      
      const isLeaderDead = (now - leaderTimestamp) > 45000; // Leader died if inactive for 45s
      const isCurrentLeader = currentLeader === tabIdRef.current;

      if (!isCurrentLeader && !isLeaderDead) {
        // Another tab is actively acting as leader, skip to avoid double messages
        return;
      }

      // Claim or renew leadership
      localStorage.setItem(LEADER_KEY, tabIdRef.current);
      localStorage.setItem(`${LEADER_KEY}_ts`, now.toString());

      // 2. Cooldown check (Run at most once every 5 minutes in background)
      const lastCheck = parseInt(localStorage.getItem(LAST_CHECK_KEY) || "0", 10);
      const FIVE_MINUTES = 5 * 60 * 1000;

      if (now - lastCheck < FIVE_MINUTES) {
        return;
      }

      // Record check timestamp
      localStorage.setItem(LAST_CHECK_KEY, now.toString());

      // 3. Trigger proactive check (force = false to respect cooldown & anti-spam)
      await triggerProactiveNow(undefined, false);
    };

    // Run first check 15 seconds after page load
    const initialTimer = setTimeout(checkEligibilityAndRun, 15000);

    // Then check every 60 seconds
    const interval = setInterval(checkEligibilityAndRun, 60000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [enabled, triggerProactiveNow]);

  return {
    isCheckingProactive: isChecking,
    triggerProactiveNow
  };
}
