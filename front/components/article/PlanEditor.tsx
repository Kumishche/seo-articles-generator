"use client";

import { useRef } from "react";

interface PlanEditorProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

const MIN_LINES = 7;

/** Текстовое поле с нумерацией строк: план читается как черновик оглавления */
export function PlanEditor({ id, value, onChange, placeholder }: PlanEditorProps) {
  const gutterRef = useRef<HTMLDivElement>(null);
  const source = value || placeholder;
  const lines = Math.max(MIN_LINES, source.split("\n").length);

  return (
    <div className="flex overflow-hidden rounded-md border border-zinc-300/90 bg-white shadow-[0_1px_1px_rgb(24_24_27/0.03)] transition-[border-color,box-shadow] duration-150 hover:border-zinc-400/80 focus-within:border-accent focus-within:ring-[3px] focus-within:ring-accent/15 focus-within:hover:border-accent">
      <div
        ref={gutterRef}
        aria-hidden
        className="w-10 shrink-0 select-none overflow-hidden border-r border-zinc-100 bg-zinc-50/80 py-3 pr-2.5 text-right font-mono text-[11px] leading-6 text-zinc-400"
      >
        {Array.from({ length: lines }, (_, i) => (
          <div key={i}>{i + 1}</div>
        ))}
      </div>
      <textarea
        id={id}
        value={value}
        rows={MIN_LINES}
        onChange={(e) => onChange(e.target.value)}
        onScroll={(e) => {
          if (gutterRef.current) gutterRef.current.scrollTop = e.currentTarget.scrollTop;
        }}
        placeholder={placeholder}
        spellCheck={false}
        className="min-w-0 flex-1 resize-none bg-transparent px-3 py-3 font-mono text-[13px] leading-6 text-zinc-900 [field-sizing:content] placeholder:text-zinc-400 focus:outline-none"
      />
    </div>
  );
}
