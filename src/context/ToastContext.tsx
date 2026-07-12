import React, { createContext, useContext, useState, useCallback } from "react";
import { createPortal } from "react-dom";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export interface ConfirmToastOptions {
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
}

interface ConfirmToastState {
  id: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  tone: "danger" | "default";
  resolve: (value: boolean) => void;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  confirmToast: (message: string, options?: ConfirmToastOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirms, setConfirms] = useState<ConfirmToastState[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Remove toast after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const confirmToast = useCallback((message: string, options?: ConfirmToastOptions) => {
    return new Promise<boolean>((resolve) => {
      const id = Math.random().toString(36).substring(2, 9);
      const settle = (value: boolean) => {
        setConfirms((prev) => prev.filter((c) => c.id !== id));
        resolve(value);
      };
      setConfirms((prev) => [
        ...prev,
        {
          id,
          message,
          confirmLabel: options?.confirmLabel || "Confirm",
          cancelLabel: options?.cancelLabel || "Cancel",
          tone: options?.tone || "default",
          resolve: settle
        }
      ]);
    });
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, confirmToast }}>
      {children}
      {createPortal(
        <div className="fixed bottom-6 right-6 z-[99999] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
          {toasts.map((toast) => {
            let glowClass = "shadow-[0_0_12px_rgba(42,122,95,0.25)] border-accent/30";
            let iconColor = "text-accent";
            let iconSvg = (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            );

            if (toast.type === "error") {
              glowClass = "shadow-[0_0_12px_rgba(239,68,68,0.25)] border-red-500/30";
              iconColor = "text-red-500";
              iconSvg = (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              );
            } else if (toast.type === "info") {
              glowClass = "shadow-[0_0_12px_rgba(59,130,246,0.25)] border-blue-500/30";
              iconColor = "text-blue-400";
              iconSvg = (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              );
            }

            return (
              <div
                key={toast.id}
                className={`pointer-events-auto flex items-center gap-3 bg-[#0d0d0f]/95 border p-4 rounded-2xl text-xs uppercase tracking-wider font-light text-slate-200 backdrop-blur-md animate-scale-up ${glowClass}`}
              >
                <div className={`${iconColor} shrink-0`}>{iconSvg}</div>
                <div className="flex-grow font-mono">{toast.message}</div>
              </div>
            );
          })}

          {confirms.map((confirm) => (
            <div
              key={confirm.id}
              className={`pointer-events-auto flex flex-col gap-3 bg-[#0d0d0f]/95 border p-4 rounded-2xl text-xs text-slate-200 backdrop-blur-md animate-scale-up shadow-[0_0_16px_rgba(0,0,0,0.4)] ${
                confirm.tone === "danger" ? "border-red-500/30" : "border-white/10"
              }`}
            >
              <div className="font-mono font-light normal-case leading-relaxed">{confirm.message}</div>
              <div className="flex justify-end gap-2 uppercase tracking-wider font-bold">
                <button
                  onClick={() => confirm.resolve(false)}
                  className="px-4 py-2 rounded-full border border-white/10 text-slate-300 hover:bg-white/5 transition cursor-pointer text-[10px]"
                >
                  {confirm.cancelLabel}
                </button>
                <button
                  onClick={() => confirm.resolve(true)}
                  className={`px-4 py-2 rounded-full transition cursor-pointer text-[10px] ${
                    confirm.tone === "danger"
                      ? "bg-red-500 text-white hover:bg-red-600"
                      : "bg-white text-black hover:bg-slate-200"
                  }`}
                >
                  {confirm.confirmLabel}
                </button>
              </div>
            </div>
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
