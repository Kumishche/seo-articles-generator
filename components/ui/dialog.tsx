"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md";
  /** Запрещает закрытие, пока идет операция */
  busy?: boolean;
}

const EXIT_MS = 150;

/**
 * Модальное окно. Появляется по центру (без привязки к триггеру), поэтому
 * transform-origin остается center. Вход 200ms ease-out, выход быстрее - 150ms.
 */
export function Dialog({ open, onClose, title, description, icon, children, footer, size = "sm", busy }: DialogProps) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (open) {
      restoreFocus.current = document.activeElement as HTMLElement;
      setMounted(true);
      const raf = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      return () => cancelAnimationFrame(raf);
    }
    setVisible(false);
    const t = setTimeout(() => {
      setMounted(false);
      restoreFocus.current?.focus?.();
    }, EXIT_MS);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted]);

  useEffect(() => {
    if (!visible || !panelRef.current) return;
    const target =
      panelRef.current.querySelector<HTMLElement>("[data-autofocus]") ??
      panelRef.current.querySelector<HTMLElement>("input, select, textarea, button:not([data-close])");
    target?.focus();
  }, [visible]);

  if (!mounted) return null;

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape" && !busy) {
      e.stopPropagation();
      onClose();
    }
    if (e.key === "Tab" && panelRef.current) {
      const nodes = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea, [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6" onKeyDown={onKeyDown}>
      <div
        aria-hidden
        onClick={() => !busy && onClose()}
        className={cn(
          "absolute inset-0 bg-slate-900/40 transition-opacity",
          visible ? "opacity-100 duration-200" : "opacity-0 duration-150",
        )}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={cn(
          "relative w-full rounded-t-2xl border border-slate-200 bg-white shadow-overlay sm:rounded-xl",
          "transition-[opacity,transform] ease-(--ease-out-strong)",
          size === "sm" ? "sm:max-w-md" : "sm:max-w-lg",
          visible
            ? "translate-y-0 scale-100 opacity-100 duration-200"
            : "translate-y-3 opacity-0 duration-150 sm:translate-y-0 sm:scale-[0.96]",
        )}
      >
        <div className="flex items-start gap-3 px-6 pt-6">
          {icon}
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-base font-semibold text-slate-900">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-1.5 text-sm leading-relaxed text-slate-500">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            data-close
            aria-label="Закрыть"
            disabled={busy}
            onClick={onClose}
            className="pressable -mr-2 -mt-1 flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
          >
            <X className="size-4" />
          </button>
        </div>
        {children && <div className="px-6 pt-5">{children}</div>}
        {footer && (
          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-4 sm:flex-row sm:justify-end sm:rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
