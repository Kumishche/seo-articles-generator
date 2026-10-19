"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TabItem<T extends string> {
  id: T;
  label: ReactNode;
}

interface TabsProps<T extends string> {
  tabs: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
  /** Общая основа id для вкладок и панелей (useId в родителе) */
  idBase: string;
  className?: string;
}

/**
 * Сегментированные вкладки. Вкладки равной ширины, поэтому подложка двигается
 * только через transform (без анимации width) и не вызывает перерасчет раскладки.
 */
export function Tabs<T extends string>({ tabs, value, onChange, label, idBase: base, className }: TabsProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const index = Math.max(
    0,
    tabs.findIndex((t) => t.id === value),
  );

  function onKeyDown(e: KeyboardEvent) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (index + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    onChange(tabs[next].id);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn("relative grid rounded-lg bg-zinc-900/[0.05] p-[3px]", className)}
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden
        className="absolute inset-y-[3px] left-[3px] rounded-md bg-white shadow-[0_1px_2px_rgb(24_24_27/0.08)] ring-1 ring-zinc-950/[0.06] transition-transform duration-200 ease-(--ease-out-strong)"
        style={{ width: `calc((100% - 6px) / ${tabs.length})`, transform: `translateX(${index * 100}%)` }}
      />
      {tabs.map((tab, i) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={tabId(base, tab.id)}
            aria-selected={selected}
            aria-controls={tabPanelId(base, tab.id)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative z-[1] flex h-7 min-w-0 items-center justify-center gap-1.5 truncate rounded-md px-2 text-[13px] font-medium transition-colors duration-150",
              selected ? "text-zinc-950" : "text-zinc-500 hover:text-zinc-800",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

const tabId = (base: string, id: string) => `${base}-${id}-tab`;
const tabPanelId = (base: string, id: string) => `${base}-${id}-panel`;

interface TabPanelProps {
  idBase: string;
  id: string;
  active: boolean;
  className?: string;
  children: ReactNode;
}

/** Неактивные панели не размонтируются, чтобы сохранять состояние полей и прокрутку */
export function TabPanel({ idBase, id, active, className, children }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      id={tabPanelId(idBase, id)}
      aria-labelledby={tabId(idBase, id)}
      hidden={!active}
      tabIndex={0}
      className={cn("focus-visible:outline-offset-[-2px]", className)}
    >
      {children}
    </div>
  );
}
