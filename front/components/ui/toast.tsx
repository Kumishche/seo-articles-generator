"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { CheckCircle, Info, WarningCircle, X } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/utils";

type Tone = "success" | "info" | "warning";

interface ToastItem {
  id: number;
  title: string;
  description?: string;
  tone: Tone;
  leaving?: boolean;
}

interface ToastOptions {
  description?: string;
  tone?: Tone;
}

const ToastContext = createContext<(title: string, options?: ToastOptions) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

const DURATION = 3800;
const EXIT_MS = 180;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), EXIT_MS);
  }, []);

  const push = useCallback((title: string, options?: ToastOptions) => {
    const id = ++counter.current;
    setItems((list) => [
      ...list.slice(-2),
      { id, title, description: options?.description, tone: options?.tone ?? "success" },
    ]);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
      >
        {items.map((t) => (
          <Toast key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const icons = {
  success: <CheckCircle weight="fill" className="size-[18px] text-emerald-400" />,
  info: <Info weight="fill" className="size-[18px] text-zinc-300" />,
  warning: <WarningCircle weight="fill" className="size-[18px] text-amber-400" />,
};

function Toast({ item, onDismiss }: { item: ToastItem; onDismiss: () => void }) {
  const [paused, setPaused] = useState(false);
  const remaining = useRef(DURATION);
  const started = useRef(0);

  useEffect(() => {
    if (paused || item.leaving) return;
    started.current = Date.now();
    const t = setTimeout(onDismiss, remaining.current);
    return () => {
      clearTimeout(t);
      remaining.current -= Date.now() - started.current;
    };
  }, [paused, item.leaving, onDismiss]);

  // Таймер не идет, пока вкладка скрыта: пользователь не пропустит уведомление
  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <div
      role="status"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl bg-zinc-900 py-3 pl-3.5 pr-2 text-white shadow-overlay ring-1 ring-white/10 sm:w-[360px]",
        "transition-[opacity,transform] duration-300 ease-(--ease-out-strong) starting:translate-y-3 starting:opacity-0",
        item.leaving && "translate-y-1 opacity-0 duration-150",
      )}
    >
      <span className="mt-[1px]">{icons[item.tone]}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white">{item.title}</p>
        {item.description && <p className="mt-0.5 text-[13px] leading-relaxed text-zinc-400">{item.description}</p>}
      </div>
      <button
        type="button"
        aria-label="Закрыть уведомление"
        onClick={onDismiss}
        className="pressable -my-0.5 flex size-7 items-center justify-center rounded-md text-zinc-500 hover:bg-white/10 hover:text-zinc-200"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
