/**
 * Слой доступа к Spring Boot backend. Контракт: back/docs/openapi.yaml.
 *
 * Запросы идут на тот же origin (/api/...), Next.js проксирует их на backend
 * (rewrites в next.config.ts). NEXT_PUBLIC_API_URL нужен, только если backend
 * вызывается напрямую, минуя прокси.
 */

import type {
  AiAction,
  Article,
  ArticleOutline,
  ArticleSource,
  ArticleSummary,
  CreateArticleRequest,
  ExportFormat,
  OutlineSection,
  ResearchResponse,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

/** Ошибка API: detail из Problem Details backend или общее описание */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function errorFrom(res: Response): Promise<ApiError> {
  let detail: string | undefined;
  try {
    const body = await res.json();
    detail = typeof body?.detail === "string" ? body.detail : undefined;
  } catch {
    // тело не JSON - например, прокси не достучался до backend
  }
  return new ApiError(detail ?? defaultMessage(res.status), res.status);
}

function defaultMessage(status: number) {
  if (status === 502 || status === 503 || status === 504) return "Сервер недоступен. Попробуйте позже";
  if (status === 404) return "Не найдено";
  return `Ошибка запроса (${status})`;
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: init?.body ? { "Content-Type": "application/json", ...init?.headers } : init?.headers,
    });
  } catch {
    throw new ApiError("Нет связи с сервером", 0);
  }
  if (!res.ok) throw await errorFrom(res);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const json = (body: unknown): RequestInit => ({ body: JSON.stringify(body) });

/** Загрузка файла с прогрессом: fetch не умеет сообщать о прогрессе отправки */
function upload(file: File, onProgress?: (percent: number) => void): Promise<ArticleSource> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append("file", file);
    xhr.open("POST", `${API_URL}/files`);
    xhr.responseType = "json";
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.min(99, Math.round((e.loaded / e.total) * 100)));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve(xhr.response as ArticleSource);
      } else {
        const detail = (xhr.response as { detail?: string } | null)?.detail;
        reject(new ApiError(detail ?? defaultMessage(xhr.status), xhr.status));
      }
    };
    xhr.onerror = () => reject(new ApiError("Нет связи с сервером", 0));
    xhr.send(form);
  });
}

export const articleApi = {
  listArticles: () => request<ArticleSummary[]>("/articles"),

  createArticle: (payload: CreateArticleRequest) =>
    request<{ id: string }>("/articles", { method: "POST", ...json(payload) }),

  uploadFile: upload,

  deleteFile: (fileId: string) => request<void>(`/files/${encodeURIComponent(fileId)}`, { method: "DELETE" }),

  getResearch: (id: string) => request<ResearchResponse>(`/articles/${id}/research`),

  restartResearch: (id: string) => request<ResearchResponse>(`/articles/${id}/research`, { method: "POST" }),

  saveOutline: (id: string, sections: OutlineSection[]) =>
    request<ArticleOutline>(`/articles/${id}/outline`, { method: "PUT", ...json({ sections }) }),

  generateArticle: (id: string, sections: OutlineSection[]) =>
    request<Article>(`/articles/${id}/generate`, { method: "POST", ...json({ sections }) }),

  getArticle: (id: string) => request<Article>(`/articles/${id}`),

  saveArticle: (id: string, patch: Partial<Pick<Article, "title" | "content" | "seoTitle" | "metaDescription">>) =>
    request<Article>(`/articles/${id}`, { method: "PUT", ...json(patch) }),

  regenerateArticle: (id: string) => request<Article>(`/articles/${id}/regenerate`, { method: "POST" }),

  deleteArticle: (id: string) => request<void>(`/articles/${id}`, { method: "DELETE" }),

  applyParagraphAction: async (id: string, action: AiAction, text: string) =>
    (await request<{ text: string }>(`/articles/${id}/paragraph-actions`, { method: "POST", ...json({ action, text }) }))
      .text,

  /** Скачивает файл, который собрал backend из сохраненной версии статьи */
  async exportArticle(id: string, format: ExportFormat): Promise<{ filename: string; blob: Blob }> {
    let res: Response;
    try {
      res = await fetch(`${API_URL}/articles/${id}/export?format=${format}`);
    } catch {
      throw new ApiError("Нет связи с сервером", 0);
    }
    if (!res.ok) throw await errorFrom(res);
    return { filename: filenameFrom(res.headers.get("Content-Disposition")) ?? `article.${format}`, blob: await res.blob() };
  },
};

/** Имя файла из Content-Disposition, включая форму filename*=UTF-8'' */
function filenameFrom(header: string | null) {
  if (!header) return null;
  const encoded = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (encoded) return decodeURIComponent(encoded[1]);
  return header.match(/filename="?([^";]+)"?/i)?.[1] ?? null;
}

export function errorMessage(e: unknown) {
  return e instanceof Error ? e.message : "Неизвестная ошибка";
}
