import type { AiAction } from "./types";

/** Этапы анализа в том же порядке, что и на backend (ResearchService.STAGES) */
export const analysisStages = [
  "Анализируем поисковую выдачу...",
  "Изучаем страницы конкурентов...",
  "Определяем поисковый интент...",
  "Подбираем ключевые запросы...",
  "Формируем структуру статьи...",
];

/** Домен сайта для предпросмотра сниппета: подключения сайтов в этой версии нет */
export const SITE_DOMAIN = process.env.NEXT_PUBLIC_SITE_DOMAIN || "example.ru";

/** Как часто опрашивать статус анализа */
export const RESEARCH_POLL_MS = 1500;

export const aiActionLabels: Record<AiAction, { button: string; done: string }> = {
  rewrite: { button: "Переписать", done: "Абзац переписан" },
  shorten: { button: "Сократить", done: "Абзац сокращен" },
  expand: { button: "Расширить", done: "Абзац дополнен" },
  improve: { button: "Улучшить стиль", done: "Стиль абзаца улучшен" },
};
