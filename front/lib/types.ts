/**
 * Модели данных фронтенда.
 * Структура повторяет DTO будущего Spring Boot backend, поэтому даты передаются
 * строками в формате ISO 8601, а идентификаторы - строками.
 */

export type ArticleStatus =
  | "draft"
  | "analyzing"
  | "structure_ready"
  | "generating"
  | "review"
  | "published";

export type HeadingLevel = 1 | 2 | 3;

export type SearchIntentType =
  | "informational"
  | "commercial"
  | "transactional"
  | "navigational";

export type Confidence = "high" | "medium" | "low";

export type Relevance = "high" | "medium" | "low";

export interface ArticleSource {
  id: string;
  type: "link" | "file";
  /** Для ссылок - полный URL, для файлов - имя файла */
  title: string;
  url?: string;
  domain?: string;
  /** Размер файла в байтах */
  size?: number;
  mimeType?: string;
  addedAt: string;
}

export interface OutlineSection {
  id: string;
  level: HeadingLevel;
  title: string;
}

export interface ArticleOutline {
  articleId: string;
  sections: OutlineSection[];
  estimatedWords: { min: number; max: number };
  targetKeywords: number;
}

export interface CompetitorPage {
  id: string;
  domain: string;
  title: string;
  url: string;
  position: number;
  relevance: Relevance;
}

export interface Keyword {
  phrase: string;
  kind: "primary" | "secondary";
}

export interface ResearchProgress {
  /** Индекс текущего этапа, начиная с 0 */
  stage: number;
  total: number;
  label: string;
}

export type ResearchStatus = "pending" | "completed" | "failed";

/**
 * Ответ GET /articles/{id}/research. Пока анализ идет или если он упал,
 * поля результата равны null.
 */
export type ResearchResponse = {
  [K in keyof ResearchResult]: K extends "articleId" | "status" | "articleStatus"
    ? ResearchResult[K]
    : ResearchResult[K] | null;
};

/** Завершенный анализ: все поля результата заполнены */
export interface ResearchResult {
  articleId: string;
  status: ResearchStatus;
  /** Статус статьи: так экран структуры узнает об уже идущей генерации */
  articleStatus: ArticleStatus;
  /** Причина, по которой не удалась последняя генерация */
  generationError: string | null;
  progress: ResearchProgress | null;
  error: string | null;
  serpResultsAnalyzed: number;
  competitorPagesAnalyzed: number;
  intent: {
    type: SearchIntentType;
    description: string;
    confidence: Confidence;
  };
  keywords: Keyword[];
  competitors: CompetitorPage[];
  recommendations: string[];
  outline: ArticleOutline;
  completedAt: string;
}

export interface SeoCheck {
  id: string;
  label: string;
  status: "passed" | "warning" | "failed";
  hint?: string;
}

export interface KeywordStat {
  phrase: string;
  /** Ожидаемое количество упоминаний по результатам анализа */
  target: number;
}

export interface SeoAnalysis {
  score: number;
  maxScore: number;
  verdict: string;
  summary: string;
  checks: SeoCheck[];
  keywords: KeywordStat[];
}

export interface Article {
  id: string;
  topic: string;
  requirements?: string | null;
  draftPlan?: string | null;
  status: ArticleStatus;
  title: string;
  /** HTML-содержимое статьи без H1 */
  content: string;
  seoTitle: string;
  metaDescription: string;
  slug: string;
  sources: ArticleSource[];
  usedSources: CompetitorPage[];
  /** null, пока статья не сгенерирована */
  seo: SeoAnalysis | null;
  createdAt: string;
  updatedAt: string;
}

/** Краткие сведения для списка статей */
export interface ArticleSummary {
  id: string;
  topic: string;
  title: string;
  status: ArticleStatus;
  seoScore: number | null;
  createdAt: string;
  updatedAt: string;
}

export type ExportFormat = "html" | "markdown" | "txt";

export type AiAction = "rewrite" | "shorten" | "expand" | "improve";

export interface CreateArticleRequest {
  topic: string;
  requirements?: string | null;
  draftPlan?: string | null;
  sources: ArticleSource[];
}

export interface UserProfile {
  name: string;
  role: string;
  initials: string;
}
