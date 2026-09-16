"use client";

import React, { useState, useCallback, createContext, useContext, useEffect } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  title?: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "primary";
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ToastContextValue {
  toast: {
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
    confirm: (options: ConfirmOptions) => void;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmModal, setConfirmModal] = useState<ConfirmOptions | null>(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, variant: ToastVariant, title?: string, duration: number = 4000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const newToast: ToastItem = { id, message, variant, title, duration };
    
    setToasts(prev => {
      // Keep maximum 4 toasts at a time to prevent clutter
      const next = [...prev, newToast];
      if (next.length > 4) next.shift();
      return next;
    });

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = {
    success: (message: string, title?: string) => addToast(message, "success", title),
    error: (message: string, title?: string) => addToast(message, "error", title),
    warning: (message: string, title?: string) => addToast(message, "warning", title),
    info: (message: string, title?: string) => addToast(message, "info", title),
    confirm: (options: ConfirmOptions) => setConfirmModal(options),
  };

  const handleConfirmAction = async () => {
    if (!confirmModal) return;
    setIsConfirmLoading(true);
    try {
      await confirmModal.onConfirm();
    } finally {
      setIsConfirmLoading(false);
      setConfirmModal(null);
    }
  };

  const handleCancelAction = () => {
    if (!confirmModal) return;
    confirmModal.onCancel?.();
    setConfirmModal(null);
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Floating Modern Toast Notifications (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-[99999] flex flex-col gap-3 pointer-events-none max-w-sm w-full sm:w-[380px] px-4 sm:px-0">
        <AnimatePresence mode="popLayout">
          {toasts.map(t => {
            const isSuccess = t.variant === "success";
            const isError = t.variant === "error";
            const isWarning = t.variant === "warning";

            const borderClass = isSuccess 
              ? "border-emerald-200/80 dark:border-emerald-800/40 bg-white/95 dark:bg-gray-900/95" 
              : isError 
              ? "border-red-200/80 dark:border-red-800/40 bg-white/95 dark:bg-gray-900/95" 
              : isWarning
              ? "border-amber-200/80 dark:border-amber-800/40 bg-white/95 dark:bg-gray-900/95"
              : "border-blue-200/80 dark:border-blue-800/40 bg-white/95 dark:bg-gray-900/95";

            const iconBadge = isSuccess ? (
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/30">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            ) : isError ? (
              <div className="w-8 h-8 rounded-xl bg-red-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-red-500/30">
                <AlertCircle className="w-4 h-4" />
              </div>
            ) : isWarning ? (
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30">
                <AlertTriangle className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/30">
                <Info className="w-4 h-4" />
              </div>
            );

            const progressBg = isSuccess 
              ? "bg-emerald-500" 
              : isError 
              ? "bg-red-500" 
              : isWarning 
              ? "bg-amber-500" 
              : "bg-blue-600";

            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className={`relative overflow-hidden backdrop-blur-xl border rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] p-4 pointer-events-auto flex items-start gap-3.5 ${borderClass}`}
              >
                {iconBadge}

                <div className="flex-1 min-w-0 pr-1">
                  {t.title && (
                    <h5 className="text-xs font-bold text-gray-900 dark:text-gray-100 mb-0.5 tracking-tight">
                      {t.title}
                    </h5>
                  )}
                  <p className="text-xs text-gray-700 dark:text-gray-300 font-medium leading-relaxed break-words">
                    {t.message}
                  </p>
                </div>

                <button
                  onClick={() => removeToast(t.id)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0 cursor-pointer"
                  title="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Animated Duration Progress Bar */}
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: (t.duration || 4000) / 1000, ease: "linear" }}
                  className={`absolute bottom-0 left-0 h-1 opacity-70 ${progressBg}`}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Custom Confirmation Modal Dialog (Replacement for window.confirm) */}
      <AnimatePresence>
        {confirmModal && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCancelAction}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* Modal Dialog Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md backdrop-blur-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.2)] z-10"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                  confirmModal.variant === "danger"
                    ? "bg-red-500 text-white shadow-red-500/25"
                    : confirmModal.variant === "warning"
                    ? "bg-amber-500 text-white shadow-amber-500/25"
                    : "bg-blue-600 text-white shadow-blue-500/25"
                }`}>
                  {confirmModal.variant === "danger" ? (
                    <AlertCircle className="w-6 h-6" />
                  ) : confirmModal.variant === "warning" ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : (
                    <HelpCircle className="w-6 h-6" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                    {confirmModal.title || "Konfirmasi Tindakan"}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1.5 leading-relaxed font-normal">
                    {confirmModal.message}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-800/80 pt-4">
                <button
                  type="button"
                  onClick={handleCancelAction}
                  disabled={isConfirmLoading}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer disabled:opacity-50"
                >
                  {confirmModal.cancelText || "Batal"}
                </button>

                <button
                  type="button"
                  onClick={handleConfirmAction}
                  disabled={isConfirmLoading}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 ${
                    confirmModal.variant === "danger"
                      ? "bg-red-600 hover:bg-red-700 shadow-red-600/30"
                      : confirmModal.variant === "warning"
                      ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/30"
                      : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/30"
                  }`}
                >
                  {isConfirmLoading && (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {confirmModal.confirmText || "Lanjutkan"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue["toast"] {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx.toast;
}
