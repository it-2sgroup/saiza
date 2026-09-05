"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type ToastKind = "success" | "error";
type ToastItem = { id: number; kind: ToastKind; message: string; leaving: boolean };

type ToastContextValue = {
  success: (message: string) => void;
  error: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const AUTO_DISMISS_MS = 5000;
// Must match the --animate-toast-out duration in globals.css — the toast is
// only actually removed from the list once its exit animation has had time
// to play, otherwise it'd just vanish instead of sliding away.
const EXIT_ANIMATION_MS = 250;

const KIND_STYLES: Record<ToastKind, { badge: string; bar: string; icon: React.ReactNode }> = {
  success: {
    badge: "bg-emerald-50 text-emerald-600",
    bar: "bg-emerald-500",
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    ),
  },
  error: {
    badge: "bg-red-50 text-red-600",
    bar: "bg-red-500",
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 9v4M12 17h.01" />
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      </svg>
    ),
  },
};

// Mounted once at the admin layout level so any page/component under
// /admin can report "action just finished" feedback without each one
// building its own transient banner. Server Actions only expose success/
// error via the state useActionState returns, so callers still need a
// small effect watching that state — see useToastOnActionState.
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  // Two-step removal: mark "leaving" (plays the slide-out animation) THEN
  // drop from the array once that animation has actually had time to run —
  // removing immediately would cut the exit animation off entirely.
  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismiss = useCallback(
    (id: number) => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      setTimeout(() => remove(id), EXIT_ANIMATION_MS);
    },
    [remove],
  );

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev, { id, kind, message, leaving: false }]);
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const value: ToastContextValue = {
    success: (message) => push("success", message),
    error: (message) => push("error", message),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Top-right, stacking downward — the convention modern SaaS dashboards
          (Vercel, Linear, Notion) settled on: it never sits over a bottom
          toolbar/nav, and new toasts push older ones down rather than
          covering them. */}
      <div
        className="pointer-events-none fixed top-4 right-4 z-[200] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2.5"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const styles = KIND_STYLES[t.kind];
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto overflow-hidden ${t.leaving ? "animate-toast-out" : "animate-toast-in"}`}
            >
              <div className="relative overflow-hidden rounded-2xl border border-line bg-card shadow-[0_20px_45px_rgba(22,33,62,0.18)]">
                <div className="flex items-start gap-3 px-4 py-3.5">
                  <span className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${styles.badge}`}>
                    {styles.icon}
                  </span>
                  <p className="flex-1 pt-0.5 text-[13.5px] leading-snug font-medium text-ink">{t.message}</p>
                  <button
                    type="button"
                    onClick={() => dismiss(t.id)}
                    aria-label="Đóng thông báo"
                    className="flex-shrink-0 cursor-pointer rounded-full p-1 text-ink-2/60 transition-colors duration-200 ease-soft hover:bg-wash hover:text-ink"
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {!t.leaving && (
                  <div className="absolute inset-x-0 bottom-0 h-[3px] bg-black/[0.06]">
                    <div
                      className={`h-full origin-left ${styles.bar}`}
                      style={{ animation: `toastCountdown ${AUTO_DISMISS_MS}ms linear forwards` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}
