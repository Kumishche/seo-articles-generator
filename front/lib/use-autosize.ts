"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * Высота textarea по содержимому. Поле никогда не прокручивается само (overflow: hidden),
 * поэтому у однострочного заголовка не появляется лишняя полоса прокрутки,
 * а в браузерах без field-sizing длинный текст не обрезается.
 */
export function useAutosize<T extends HTMLTextAreaElement>(value: string) {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    };
    fit();
    // Перенос строк меняется вместе с шириной колонки
    const observer = new ResizeObserver(fit);
    observer.observe(el.parentElement ?? el);
    return () => observer.disconnect();
  }, [value]);

  return ref;
}
