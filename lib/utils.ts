import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Склонение: plural(5, ["слово", "слова", "слов"]) -> "слов" */
export function plural(n: number, forms: [string, string, string]) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

const numberFormatter = new Intl.NumberFormat("ru-RU");

export function formatNumber(n: number) {
  return numberFormatter.format(n);
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} МБ`;
}

export function countWords(text: string) {
  return text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

/** Средняя скорость чтения русского текста - около 220 слов в минуту */
export function readingTime(words: number) {
  return Math.max(1, Math.round(words / 220));
}

export function countOccurrences(text: string, phrase: string) {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (text.match(new RegExp(escaped, "giu")) ?? []).length;
}

/** Нормализует ввод пользователя в URL. Возвращает null, если это не ссылка. */
export function normalizeUrl(raw: string): URL | null {
  const value = raw.trim();
  if (!value) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (!url.hostname.includes(".") || url.hostname.endsWith(".")) return null;
    return url;
  } catch {
    return null;
  }
}

export function shortenUrl(url: string, max = 48) {
  const clean = url.replace(/^https?:\/\/(www\.)?/, "");
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

export function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
