"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowArcLeft,
  ArrowArcRight,
  CaretDown,
  LinkSimple,
  ListBullets,
  ListNumbers,
  Quotes,
  TextB,
  TextItalic,
  TextUnderline,
} from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/utils";

export type BlockType = "p" | "h2" | "h3";

export interface ToolbarState {
  block: BlockType;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  ul: boolean;
  ol: boolean;
  quote: boolean;
}

export type ToolbarCommand =
  | { type: "block"; value: BlockType }
  | { type: "bold" | "italic" | "underline" | "ul" | "ol" | "quote" | "undo" | "redo" }
  | { type: "link"; url: string };

interface EditorToolbarProps {
  state: ToolbarState;
  onCommand: (cmd: ToolbarCommand) => void;
  disabled?: boolean;
}

const blockOptions: { value: BlockType; label: string }[] = [
  { value: "p", label: "Обычный текст" },
  { value: "h2", label: "Заголовок H2" },
  { value: "h3", label: "Заголовок H3" },
];

export function EditorToolbar({ state, onCommand, disabled }: EditorToolbarProps) {
  const [linkOpen, setLinkOpen] = useState(false);

  return (
    <div
      role="toolbar"
      aria-label="Форматирование текста"
      className="mx-auto flex max-w-[760px] items-center gap-0.5 overflow-x-auto px-3 py-1.5 [scrollbar-width:none] sm:px-8"
    >
      <div className="relative shrink-0">
        <label htmlFor="block-style" className="sr-only">
          Стиль текста
        </label>
        <select
          id="block-style"
          value={state.block}
          disabled={disabled}
          onChange={(e) => onCommand({ type: "block", value: e.target.value as BlockType })}
          className="h-8 w-[142px] appearance-none rounded-md bg-transparent pl-2 pr-7 text-[13px] font-medium text-zinc-700 transition-colors duration-150 hover:bg-zinc-900/5 focus:bg-zinc-900/5 focus:outline-none"
        >
          {blockOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <CaretDown
          aria-hidden
          className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400"
        />
      </div>

      <Divider />
      <ToolButton
        label="Жирный (Ctrl+B)"
        active={state.bold}
        disabled={disabled}
        onClick={() => onCommand({ type: "bold" })}
      >
        <TextB weight="bold" />
      </ToolButton>
      <ToolButton
        label="Курсив (Ctrl+I)"
        active={state.italic}
        disabled={disabled}
        onClick={() => onCommand({ type: "italic" })}
      >
        <TextItalic />
      </ToolButton>
      <ToolButton
        label="Подчеркнутый (Ctrl+U)"
        active={state.underline}
        disabled={disabled}
        onClick={() => onCommand({ type: "underline" })}
      >
        <TextUnderline />
      </ToolButton>

      <Divider />
      <div className="relative">
        <ToolButton label="Ссылка" active={linkOpen} disabled={disabled} onClick={() => setLinkOpen((v) => !v)}>
          <LinkSimple />
        </ToolButton>
        {linkOpen && (
          <LinkPopover
            onClose={() => setLinkOpen(false)}
            onSubmit={(url) => {
              onCommand({ type: "link", url });
              setLinkOpen(false);
            }}
          />
        )}
      </div>
      <ToolButton
        label="Маркированный список"
        active={state.ul}
        disabled={disabled}
        onClick={() => onCommand({ type: "ul" })}
      >
        <ListBullets />
      </ToolButton>
      <ToolButton
        label="Нумерованный список"
        active={state.ol}
        disabled={disabled}
        onClick={() => onCommand({ type: "ol" })}
      >
        <ListNumbers />
      </ToolButton>
      <ToolButton label="Цитата" active={state.quote} disabled={disabled} onClick={() => onCommand({ type: "quote" })}>
        <Quotes />
      </ToolButton>

      <Divider />
      <ToolButton label="Отменить (Ctrl+Z)" disabled={disabled} onClick={() => onCommand({ type: "undo" })}>
        <ArrowArcLeft />
      </ToolButton>
      <ToolButton label="Повторить (Ctrl+Y)" disabled={disabled} onClick={() => onCommand({ type: "redo" })}>
        <ArrowArcRight />
      </ToolButton>
    </div>
  );
}

function Divider() {
  return <span aria-hidden className="mx-1.5 h-4 w-px shrink-0 bg-zinc-200" />;
}

interface ToolButtonProps {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}

function ToolButton({ label, active, disabled, onClick, children }: ToolButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      // Не забираем фокус у редактора, чтобы не потерять выделение
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "pressable flex size-8 shrink-0 items-center justify-center rounded-md text-zinc-500 [&>svg]:size-[17px]",
        "hover:bg-zinc-900/5 hover:text-zinc-950 disabled:opacity-40",
        active && "bg-zinc-900 text-white hover:bg-zinc-800 hover:text-white",
      )}
    >
      {children}
    </button>
  );
}

function LinkPopover({ onSubmit, onClose }: { onSubmit: (url: string) => void; onClose: () => void }) {
  const [url, setUrl] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-40 mt-2 w-72 origin-top-left rounded-lg bg-white p-2 shadow-overlay ring-1 ring-zinc-950/10 transition-[opacity,transform] duration-150 ease-(--ease-out-strong) starting:scale-[0.97] starting:opacity-0"
    >
      <form
        className="flex gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          if (url.trim()) onSubmit(url.trim());
        }}
      >
        <input
          autoFocus
          type="text"
          inputMode="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && onClose()}
          placeholder="https://example.ru/blog/..."
          aria-label="Адрес ссылки"
          className="h-8 min-w-0 flex-1 rounded-md border border-zinc-300 px-2 text-[13px] focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent/15"
        />
        <button
          type="submit"
          className="pressable h-8 rounded-md bg-accent px-2.5 text-[13px] font-medium text-white hover:bg-accent-hover"
        >
          Вставить
        </button>
      </form>
      <p className="mt-1.5 px-1 text-[11px] text-zinc-500">
        Выделите текст перед вставкой или ссылка добавится в позицию курсора.
      </p>
    </div>
  );
}
