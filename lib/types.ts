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

export interface ResearchResult {
  articleId: string;
  status: "pending" | "completed" | "failed";
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
  requirements?: string;
  draftPlan?: string;
  status: ArticleStatus;
  title: string;
  /** HTML-содержимое статьи без H1 */
  content: string;
  seoTitle: string;
  metaDescription: string;
  slug: string;
  sources: ArticleSource[];
  usedSources: CompetitorPage[];
  seo: SeoAnalysis;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectedSite {
  id: string;
  platform: "wordpress" | "tilda" | "bitrix";
  domain: string;
  label: string;
}

export interface PublicationSettings {
  mode: "site" | "export";
  siteId?: string;
  path?: string;
  publishStatus?: "draft" | "publish";
  exportFormat?: "html" | "markdown" | "txt";
}

export interface CreateArticleRequest {
  topic: string;
  requirements?: string;
  draftPlan?: string;
  sources: ArticleSource[];
}

export interface UserProfile {
  name: string;
  role: string;
  initials: string;
}
