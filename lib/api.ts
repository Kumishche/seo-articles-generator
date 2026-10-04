/**
 * Слой доступа к данным.
 *
 * Сейчас все методы возвращают mock-данные с искусственной задержкой.
 * Для подключения Spring Boot backend достаточно задать NEXT_PUBLIC_API_URL
 * и заменить тело методов на вызовы request(). Сигнатуры и типы менять не нужно:
 * они совпадают с ожидаемыми REST-эндпоинтами.
 *
 *   POST /api/articles                      -> createArticle
 *   GET  /api/articles/{id}/research        -> getResearch
 *   PUT  /api/articles/{id}/outline         -> saveOutline
 *   POST /api/articles/{id}/generate        -> generateArticle
 *   GET  /api/articles/{id}                 -> getArticle
 *   PUT  /api/articles/{id}                 -> saveArticle
 *   POST /api/articles/{id}/publish         -> publishArticle
 */

import { connectedSites, demoArticle, DEMO_ARTICLE_ID, researchResult } from "./mock-data";
import type {
  Article,
  ConnectedSite,
  CreateArticleRequest,
  OutlineSection,
  PublicationSettings,
  ResearchResult,
} from "./types";
import { wait } from "./utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL не задан");
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) throw new Error(`Ошибка запроса ${res.status}`);
  return res.json() as Promise<T>;
}

export const articleApi = {
  async createArticle(_payload: CreateArticleRequest): Promise<{ id: string }> {
    await wait(400);
    return { id: DEMO_ARTICLE_ID };
  },

  async getResearch(_id: string): Promise<ResearchResult> {
    return researchResult;
  },

  async saveOutline(_id: string, _sections: OutlineSection[]): Promise<void> {
    await wait(600);
  },

  async generateArticle(_id: string, _sections: OutlineSection[]): Promise<{ id: string }> {
    await wait(1200);
    return { id: DEMO_ARTICLE_ID };
  },

  async getArticle(_id: string): Promise<Article> {
    return demoArticle;
  },

  async saveArticle(_id: string, _patch: Partial<Article>): Promise<void> {
    await wait(500);
  },

  async regenerateArticle(_id: string): Promise<void> {
    await wait(1800);
  },

  async getConnectedSites(): Promise<ConnectedSite[]> {
    return connectedSites;
  },

  async publishArticle(_id: string, _settings: PublicationSettings): Promise<{ url?: string }> {
    await wait(1100);
    return { url: "https://example.ru/blog/crm-dlya-malogo-biznesa" };
  },
};
