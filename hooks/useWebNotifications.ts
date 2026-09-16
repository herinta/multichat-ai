import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/components/Modern/Toast";

interface NotificationPayload {
  body: string;
  icon?: string;
  tag?: string;
  data?: {
    roomId?: string;
    [key: string]: any;
  };
}

interface UseWebNotificationsOptions {
  onOpenRoom?: (roomId: string) => void;
}

export function useWebNotifications({ onOpenRoom }: UseWebNotificationsOptions = {}) {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [canInstall, setCanInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const deferredPromptRef = useRef<any>(null);
  const toast = useToast();

  // 1. Check Notification & PWA Support + Register SW
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check Standalone (already installed on homescreen)
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
    };
    checkStandalone();

    // Check Notification support
    if (!("Notification" in window)) {
      setPermission("unsupported");
    } else {
      setPermission(Notification.permission);
    }

    // Register Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("Service Worker registered successfully:", reg.scope);
        })
        .catch((err) => {
          console.error("Service Worker registration failed:", err);
        });

      // Listen for messages from SW (e.g. notification click -> open room)
      const handleSwMessage = (event: MessageEvent) => {
        if (event.data?.type === "OPEN_ROOM" && event.data?.roomId) {
          onOpenRoom?.(event.data.roomId);
        }
      };

      navigator.serviceWorker.addEventListener("message", handleSwMessage);
      return () => {
        navigator.serviceWorker.removeEventListener("message", handleSwMessage);
      };
    }
  }, [onOpenRoom]);

  // 2. Listen for PWA Install Prompt (beforeinstallprompt)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setCanInstall(false);
      setIsStandalone(true);
      deferredPromptRef.current = null;
      toast.success("🎉 Multi-AI berhasil dipasang di layar utama HP Anda!");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [toast]);

  // 3. Request Notification Permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Browser ini tidak mendukung notifikasi.");
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        toast.success("🔔 Notifikasi berhasil diaktifkan!");
        return true;
      } else if (result === "denied") {
        toast.error("Notifikasi diblokir di browser. Buka setelan browser untuk mengizinkan.");
        return false;
      }
      return false;
    } catch (err) {
      console.error("Failed to request notification permission:", err);
      return false;
    }
  }, [toast]);

  // 4. Send Push/Browser Notification
  const sendNotification = useCallback(
    async (title: string, payload: NotificationPayload) => {
      if (typeof window === "undefined" || !("Notification" in window)) return;
      if (Notification.permission !== "granted") return;

      const options: NotificationOptions = {
        body: payload.body,
        icon: payload.icon || "/icon-192.png",
        badge: "/icon-192.png",
        tag: payload.tag || "multi-ai-chat",
        vibrate: [100, 50, 100],
        data: payload.data || {}
      } as any;

      try {
        // Prefer Service Worker showNotification if available (works on mobile/background)
        if ("serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.ready;
          if (reg && reg.showNotification) {
            await reg.showNotification(title, options);
            return;
          }
        }
        // Fallback to desktop Notification
        new Notification(title, options);
      } catch (err) {
        console.warn("Could not dispatch notification via Service Worker, using fallback:", err);
        try {
          new Notification(title, options);
        } catch (e) {
          console.error("Notification failed:", e);
        }
      }
    },
    []
  );

  // 5. Send Test Notification (for user to verify)
  const sendTestNotification = useCallback(async () => {
    let perm = permission;
    if (perm !== "granted") {
      const granted = await requestPermission();
      if (!granted) return;
      perm = "granted";
    }

    sendNotification("Nofa ✨", {
      body: "Halo! Notifikasi Multi-AI kamu udah aktif nih di HP / laptop!",
      icon: "/icon-192.png",
      tag: "multi-ai-test"
    });
    toast.success("Pesan notifikasi tes telah dikirim!");
  }, [permission, requestPermission, sendNotification, toast]);

  // 6. Trigger PWA Add to Home Screen Prompt
  const promptInstall = useCallback(async () => {
    if (deferredPromptRef.current) {
      deferredPromptRef.current.prompt();
      const choice = await deferredPromptRef.current.userChoice;
      if (choice.outcome === "accepted") {
        setCanInstall(false);
      }
      deferredPromptRef.current = null;
    } else {
      // iOS Safari fallback tip
      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIos) {
        toast.info("Di Safari iOS: Ketuk ikon Share (⎋) di bawah layar, lalu pilih 'Add to Home Screen' (➕)!");
      } else {
        toast.info("Gunakan menu browser (titik 3 di kanan atas) lalu pilih 'Pasang Aplikasi' / 'Add to Home screen'!");
      }
    }
  }, [toast]);

  return {
    permission,
    canInstall,
    isStandalone,
    requestPermission,
    sendNotification,
    sendTestNotification,
    promptInstall
  };
}
