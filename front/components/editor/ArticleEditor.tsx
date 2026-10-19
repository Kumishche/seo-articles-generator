"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkle } from "@phosphor-icons/react/ssr";
import { errorMessage } from "@/lib/api";
import { aiActionLabels } from "@/lib/constants";
import type { AiAction } from "@/lib/types";
import { useAutosize } from "@/lib/use-autosize";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { ARTICLE_CONTENT_ATTR } from "./ArticleToc";
import { EditorToolbar, type BlockType, type ToolbarCommand, type ToolbarState } from "./EditorToolbar";

interface ArticleEditorProps {
  title: string;
  onTitleChange: (title: string) => void;
  initialHtml: string;
  /** Смена ключа полностью перезаписывает содержимое (например, после повторной генерации) */
  contentKey: number;
  /** initial = true, когда содержимое загружено, а не изменено пользователем */
  onContentChange: (html: string, text: string, initial?: boolean) => void;
  /** AI-правка абзаца на backend: получает текст абзаца, возвращает новый */
  onAiAction: (action: AiAction, text: string) => Promise<string>;
  busy?: boolean;
  footer?: React.ReactNode;
}

/** Служебные атрибуты подсветки не должны попадать в сохраняемый HTML */
function cleanHtml(html: string) {
  return html.replace(/\s?data-ai-[a-z-]+="[^"]*"/g, "");
}

const emptyState: ToolbarState = {
  block: "p",
  bold: false,
  italic: false,
  underline: false,
  ul: false,
  ol: false,
  quote: false,
};

export function ArticleEditor({
  title,
  onTitleChange,
  initialHtml,
  contentKey,
  onContentChange,
  onAiAction,
  busy,
  footer,
}: ArticleEditorProps) {
  const toast = useToast();
  const titleRef = useAutosize<HTMLTextAreaElement>(title);
  const contentRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [toolbar, setToolbar] = useState<ToolbarState>(emptyState);
  const [aiTarget, setAiTarget] = useState<{ el: HTMLElement; top: number } | null>(null);
  const [aiBusy, setAiBusy] = useState<AiAction | null>(null);

  const emit = useCallback(() => {
    const el = contentRef.current;
    if (el) onContentChange(cleanHtml(el.innerHTML), el.innerText);
  }, [onContentChange]);

  // Подсветка абзаца, к которому относится AI-панель
  useEffect(() => {
    const el = aiTarget?.el;
    if (!el) return;
    el.dataset.aiTarget = "true";
    return () => {
      delete el.dataset.aiTarget;
    };
  }, [aiTarget?.el]);

  // Содержимое задаем вручную: React не должен перерисовывать contenteditable
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    el.innerHTML = initialHtml;
    onContentChange(el.innerHTML, el.innerText, true);
    setAiTarget(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentKey]);

  useEffect(() => {
    try {
      document.execCommand("defaultParagraphSeparator", false, "p");
    } catch {
      /* старые браузеры */
    }
  }, []);

  const currentBlock = useCallback((): HTMLElement | null => {
    const sel = window.getSelection();
    const root = contentRef.current;
    if (!sel?.anchorNode || !root || !root.contains(sel.anchorNode)) return null;
    let node: Node | null = sel.anchorNode;
    while (node && node.parentNode !== root) node = node.parentNode;
    return node instanceof HTMLElement ? node : null;
  }, []);

  // Отслеживаем выделение: состояние кнопок, сохранение диапазона, AI-панель для выделенного абзаца
  useEffect(() => {
    function onSelection() {
      const sel = window.getSelection();
      const root = contentRef.current;
      if (!sel || !root || !sel.anchorNode || !root.contains(sel.anchorNode)) return;
      savedRange.current = sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;

      const block = currentBlock();
      const tag = block?.tagName.toLowerCase();
      setToolbar({
        block: tag === "h2" || tag === "h3" ? tag : "p",
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        ul: tag === "ul",
        ol: tag === "ol",
        quote: tag === "blockquote",
      });

      if (!sel.isCollapsed && block?.tagName === "P") showAiFor(block);
    }
    document.addEventListener("selectionchange", onSelection);
    return () => document.removeEventListener("selectionchange", onSelection);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBlock]);

  function restoreSelection() {
    const el = contentRef.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    const range = savedRange.current;
    if (range && el.contains(range.commonAncestorContainer)) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }

  function exec(cmd: ToolbarCommand) {
    restoreSelection();
    switch (cmd.type) {
      case "block":
        document.execCommand("formatBlock", false, `<${cmd.value}>`);
        break;
      case "bold":
      case "italic":
      case "underline":
      case "undo":
      case "redo":
        document.execCommand(cmd.type);
        break;
      case "ul":
        document.execCommand("insertUnorderedList");
        break;
      case "ol":
        document.execCommand("insertOrderedList");
        break;
      case "quote":
        document.execCommand("formatBlock", false, toolbar.quote ? "<p>" : "<blockquote>");
        break;
      case "link": {
        const url = /^(https?:\/\/|\/|mailto:)/i.test(cmd.url) ? cmd.url : `https://${cmd.url}`;
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) {
          const a = document.createElement("a");
          a.href = url;
          a.textContent = cmd.url;
          document.execCommand("insertHTML", false, a.outerHTML);
        } else {
          document.execCommand("createLink", false, url);
        }
        break;
      }
    }
    emit();
    document.dispatchEvent(new Event("selectionchange"));
  }

  function showAiFor(block: HTMLElement) {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    if (hideTimer.current) clearTimeout(hideTimer.current);
    const top = block.getBoundingClientRect().top - wrapper.getBoundingClientRect().top;
    setAiTarget((prev) => (prev?.el === block && prev.top === top ? prev : { el: block, top }));
  }

  function onMouseOver(e: React.MouseEvent) {
    if (aiBusy || busy) return;
    const root = contentRef.current;
    let node = e.target as Node | null;
    while (node && node.parentNode !== root) node = node.parentNode;
    if (node instanceof HTMLElement && node.tagName === "P") showAiFor(node);
  }

  function scheduleHide() {
    if (aiBusy) return;
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setAiTarget(null), 220);
  }

  async function runAi(action: AiAction) {
    const target = aiTarget?.el;
    if (!target || !contentRef.current?.contains(target)) return;
    setAiBusy(action);
    target.dataset.aiBusy = "true";
    let next: string;
    try {
      next = await onAiAction(action, target.innerText);
    } catch (e) {
      delete target.dataset.aiBusy;
      setAiBusy(null);
      toast("Не удалось изменить абзац", { tone: "warning", description: errorMessage(e) });
      return;
    }
    delete target.dataset.aiBusy;
    // Пока шел запрос, абзац могли удалить
    if (!contentRef.current?.contains(target)) {
      setAiBusy(null);
      return;
    }
    // insertText сохраняет действие в истории отмены браузера (Ctrl+Z)
    const range = document.createRange();
    range.selectNodeContents(target);
    const sel = window.getSelection();
    contentRef.current.focus({ preventScroll: true });
    sel?.removeAllRanges();
    sel?.addRange(range);
    document.execCommand("insertText", false, next);
    sel?.collapseToEnd();

    target.dataset.aiUpdated = "true";
    setTimeout(() => delete target.dataset.aiUpdated, 1400);
    setAiBusy(null);
    emit();
    showAiFor(target);
    toast(aiActionLabels[action].done, { description: "Отменить изменение можно сочетанием Ctrl+Z." });
  }

  return (
    <div className="rounded-xl border border-zinc-200/90 bg-white shadow-card">
      <div className="mx-auto max-w-[760px] px-5 pb-3 pt-7 sm:px-10 sm:pt-10">
        <label htmlFor="article-title" className="sr-only">
          Заголовок статьи
        </label>
        <textarea
          id="article-title"
          ref={titleRef}
          rows={1}
          value={title}
          onChange={(e) => onTitleChange(e.target.value.replace(/\n/g, ""))}
          placeholder="Заголовок статьи"
          className="block w-full resize-none overflow-hidden bg-transparent text-2xl font-semibold leading-tight tracking-[-0.03em] text-zinc-950 placeholder:text-zinc-300 focus:outline-none sm:text-[34px] sm:leading-[1.15]"
        />
      </div>

      <div className="sticky top-(--header-h) z-10 border-y border-zinc-100 bg-white/95 backdrop-blur-sm">
        <EditorToolbar state={toolbar} onCommand={exec} disabled={busy} />
      </div>

      <div ref={wrapperRef} className="relative" onMouseOver={onMouseOver} onMouseLeave={scheduleHide}>
        <div
          ref={contentRef}
          contentEditable={!busy}
          suppressContentEditableWarning
          {...{ [ARTICLE_CONTENT_ATTR]: "" }}
          role="textbox"
          aria-multiline="true"
          aria-label="Текст статьи"
          spellCheck
          onInput={emit}
          onPaste={(e) => {
            e.preventDefault();
            document.execCommand("insertText", false, e.clipboardData.getData("text/plain"));
          }}
          className={cn(
            "article-prose mx-auto min-h-[480px] max-w-[760px] px-5 py-7 focus:outline-none sm:px-10 sm:py-9",
            busy && "pointer-events-none select-none opacity-40 transition-opacity duration-200",
          )}
        />

        {aiTarget && !busy && (
          <div
            onMouseEnter={() => hideTimer.current && clearTimeout(hideTimer.current)}
            onMouseLeave={scheduleHide}
            style={{ top: Math.max(4, aiTarget.top - 40) }}
            className="absolute right-3 z-10 flex items-center gap-0.5 rounded-lg bg-zinc-900 p-1 shadow-overlay ring-1 ring-white/10 transition-[opacity,transform] duration-150 ease-(--ease-out-strong) starting:translate-y-1 starting:opacity-0 sm:right-6"
          >
            <span className="flex items-center gap-1 border-r border-white/10 pl-1.5 pr-2 text-[12px] font-medium text-zinc-300">
              <Sparkle weight="fill" className="size-3.5" />
              <span className="hidden sm:inline">ИИ</span>
            </span>
            {(Object.keys(aiActionLabels) as AiAction[]).map((action) => (
              <button
                key={action}
                type="button"
                disabled={!!aiBusy}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => runAi(action)}
                className="pressable inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-md px-2 text-[12px] font-medium text-zinc-100 hover:bg-white/10 hover:text-white disabled:opacity-50"
              >
                {aiBusy === action && <Spinner className="size-3" />}
                {aiActionLabels[action].button}
              </button>
            ))}
          </div>
        )}

        {busy && (
          <div className="absolute inset-x-0 top-24 flex justify-center">
            <div className="flex items-center gap-3 rounded-lg bg-zinc-900 px-4 py-2.5 text-[13px] font-medium text-white shadow-overlay">
              <Spinner className="size-3.5 text-zinc-300" />
              Генерируем новую версию статьи…
            </div>
          </div>
        )}
      </div>

      {footer}
    </div>
  );
}

export type { BlockType };
