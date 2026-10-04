/**
 * Mock-реализация AI-действий над абзацем.
 * На backend эти операции будут выполняться LLM: POST /api/articles/{id}/paragraph-actions
 */

export type AiAction = "rewrite" | "shorten" | "expand" | "improve";

export const aiActionLabels: Record<AiAction, { button: string; done: string }> = {
  rewrite: { button: "Переписать", done: "Абзац переписан" },
  shorten: { button: "Сократить", done: "Абзац сокращен" },
  expand: { button: "Расширить", done: "Абзац дополнен" },
  improve: { button: "Улучшить стиль", done: "Стиль абзаца улучшен" },
};

/** Граница слова для кириллицы: \b в JS работает только с латиницей */
function word(w: string) {
  return new RegExp(String.raw`(?<!\p{L})${w}(?!\p{L})`, "gu");
}

const synonyms: [RegExp, string][] = [
  [word("Например"), "К примеру"],
  [word("например"), "к примеру"],
  [word("поэтому"), "по этой причине"],
  [word("Обычно"), "Как правило"],
  [word("обычно"), "как правило"],
  [word("помогает"), "позволяет"],
  [word("нужно"), "необходимо"],
  [word("нужны"), "необходимы"],
  [word("нужна"), "требуется"],
  [word("быстро"), "оперативно"],
  [word("Обязательно"), "Непременно"],
  [word("Когда"), "Как только"],
  [word("совершенно"), "абсолютно"],
  [word("заметно"), "ощутимо"],
];

const fillers = ["просто ", "уже ", "именно ", "действительно ", "чуть ", "нередко "].map(word);

const expansions = [
  "На практике это особенно заметно в первые месяцы после внедрения, когда команда только привыкает к новым инструментам.",
  "Такой подход помогает принимать решения на основе данных, а не интуиции.",
  "Стоит заранее обсудить этот момент с командой, чтобы избежать недопонимания на этапе запуска.",
  "Опыт небольших компаний показывает, что именно эта деталь чаще всего влияет на итоговый результат.",
];

let expansionIndex = 0;

function sentences(text: string) {
  return text.match(/[^.!?]+[.!?]+(\s|$)/g)?.map((s) => s.trim()) ?? [text.trim()];
}

function lowerFirst(s: string) {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function rewrite(text: string) {
  let out = text;
  for (const [re, to] of synonyms) out = out.replace(re, to);
  if (out === text) out = `Иначе говоря, ${lowerFirst(text)}`;
  return out;
}

export function applyAiAction(action: AiAction, text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  switch (action) {
    case "shorten": {
      const list = sentences(clean);
      if (list.length > 1) return list.slice(0, Math.ceil(list.length / 2)).join(" ");
      const cut = clean.split(/,\s/)[0];
      return cut.endsWith(".") ? cut : `${cut}.`;
    }
    case "expand": {
      const add = expansions[expansionIndex++ % expansions.length];
      return `${clean} ${add}`;
    }
    case "improve": {
      let out = clean;
      for (const re of fillers) out = out.replace(re, "");
      out = out.replace(/\s{2,}/g, " ");
      if (out !== clean) return out;
      const withSynonyms = rewrite(clean);
      return withSynonyms.startsWith("Иначе говоря") ? `Если коротко, ${lowerFirst(clean)}` : withSynonyms;
    }
    case "rewrite":
    default:
      return rewrite(clean);
  }
}
