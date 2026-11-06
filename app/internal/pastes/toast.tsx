"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const DISMISS_AFTER_MS = 4000;

interface Toast {
  key: number;
  message: string;
}

const ToastContext = createContext<(message: string) => void>(() => {});

/** Shows a message in the page's single toast. */
export function useToast(): (message: string) => void {
  return useContext(ToastContext);
}

/**
 * Owns the one toast for the dashboard. Rows share it instead of each
 * rendering their own, so two failures in a row replace one another
 * rather than stacking on the same corner of the screen.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const [held, setHeld] = useState(false);
  const nextKey = useRef(0);

  const show = useCallback((message: string) => {
    nextKey.current += 1;
    setToast({ key: nextKey.current, message });
    setHeld(false);
  }, []);

  // The key is part of the state so re-reporting the same message
  // restarts the countdown instead of inheriting the old timer.
  useEffect(() => {
    if (!toast || held) return;
    const timer = setTimeout(() => setToast(null), DISMISS_AFTER_MS);
    return () => clearTimeout(timer);
  }, [toast, held]);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <div
          role="alert"
          aria-live="assertive"
          // Hovering or tabbing into the toast holds it open, so the
          // dismiss button cannot vanish from under a keyboard user.
          onMouseEnter={() => setHeld(true)}
          onMouseLeave={() => setHeld(false)}
          onFocusCapture={() => setHeld(true)}
          onBlurCapture={() => setHeld(false)}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-4 py-2 text-sm text-red-700 dark:text-red-300 shadow-lg"
        >
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-300"
            aria-label="Dismiss error"
          >
            x
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}
