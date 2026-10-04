"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkle } from "@phosphor-icons/react/ssr";
import { aiActionLabels, applyAiAction, type AiAction } from "@/lib/ai-mock";
import { cn, wait } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast";
import { EditorToolbar, type BlockType, type ToolbarCommand, type ToolbarState } from "./EditorToolbar";

interface ArticleEditorProps {
  title: string;
  onTitleChange: (title: string) => void;
  initialHtml: string;
  /** Смена ключа полностью перезаписывает содержимое (например, после повторной генерации) */
  contentKey: number;
  /** initial = true, когда содержимое загружено, а не изменено пользователем */
  onContentChange: (html: string, text: string, initial?: boolean) => void;
  busy?: boolean;
  footer?: React.ReactNode;
}

/** Служебные атрибуты подсветки не должны попадать в сохраняемый HTML */
function cleanHtml(html: string) {
  return html.replace(/\s?data-ai-[a-z-]+="[^"]*"/g, "");
}

const emptyState: ToolbarState = { block: "p", bold: false, italic: false, underline: false, ul: false, ol: false, quote: false };

export function ArticleEditor({ title, onTitleChange, initialHtml, contentKey, onContentChange, busy, footer }: ArticleEditorProps) {
  const toast = useToast();
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
    await wait(900 + Math.random() * 400);
    delete target.dataset.aiBusy;

    const next = applyAiAction(action, target.innerText);
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
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-card">
      <div className="px-5 pb-2 pt-6 sm:px-10 sm:pt-8">
        <label htmlFor="article-title" className="sr-only">
          Заголовок статьи
        </label>
        <textarea
          id="article-title"
          rows={1}
          value={title}
          onChange={(e) => onTitleChange(e.target.value.replace(/\n/g, ""))}
          placeholder="Заголовок статьи"
          className="block w-full resize-none bg-transparent text-2xl font-semibold leading-tight tracking-tight text-slate-900 [field-sizing:content] placeholder:text-slate-300 focus:outline-none sm:text-[32px] sm:leading-[1.2]"
        />
      </div>

      <div className="sticky top-14 z-10 border-y border-slate-100 bg-white/95 backdrop-blur-sm">
        <EditorToolbar state={toolbar} onCommand={exec} disabled={busy} />
      </div>

      <div
        ref={wrapperRef}
        className="relative"
        onMouseOver={onMouseOver}
        onMouseLeave={scheduleHide}
      >
        <div
          ref={contentRef}
          contentEditable={!busy}
          suppressContentEditableWarning
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
            "article-prose min-h-[480px] px-5 py-6 focus:outline-none sm:px-10 sm:py-8",
            busy && "pointer-events-none select-none opacity-40 transition-opacity duration-200",
          )}
        />

        {aiTarget && !busy && (
          <div
            onMouseEnter={() => hideTimer.current && clearTimeout(hideTimer.current)}
            onMouseLeave={scheduleHide}
            style={{ top: Math.max(4, aiTarget.top - 40) }}
            className="absolute right-3 z-10 flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-1 shadow-raised transition-opacity duration-150 starting:opacity-0 sm:right-6"
          >
            <span className="flex items-center gap-1 px-1.5 text-[12px] font-medium text-indigo-600">
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
                className="pressable inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-md px-2 text-[12px] font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
              >
                {aiBusy === action && <Spinner className="size-3" />}
                {aiActionLabels[action].button}
              </button>
            ))}
          </div>
        )}

        {busy && (
          <div className="absolute inset-x-0 top-24 flex justify-center">
            <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-raised">
              <Spinner className="size-4 text-indigo-600" />
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
