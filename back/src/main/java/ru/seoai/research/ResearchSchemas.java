package ru.seoai.research;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonPropertyDescription;

/**
 * Форматы ответов LLM на этапах анализа. По этим классам SDK строит JSON Schema
 * для structured outputs, поэтому поля публичные, а описания попадают в схему.
 */
public final class ResearchSchemas {

    private ResearchSchemas() {
    }

    public static class SerpResults {
        @JsonPropertyDescription("Органические результаты поиска в порядке позиций")
        public List<SerpHit> results;
    }

    public static class SerpHit {
        @JsonPropertyDescription("Заголовок страницы из выдачи")
        public String title;
        @JsonPropertyDescription("Точный URL страницы, найденный в поиске")
        public String url;
        @JsonPropertyDescription("Краткое описание содержания страницы, 1-2 предложения")
        public String snippet;
    }

    public static class IntentAnalysis {
        @JsonPropertyDescription("Тип поискового интента: informational, commercial, transactional или navigational")
        public String intentType;
        @JsonPropertyDescription("Что именно хотят получить пользователи, 1-2 предложения")
        public String description;
        @JsonPropertyDescription("Уверенность в определении интента: high, medium или low")
        public String confidence;
        @JsonPropertyDescription("Оценка релевантности каждого материала конкурента")
        public List<CompetitorRelevance> competitors;
        @JsonPropertyDescription("4-6 конкретных рекомендаций к содержанию статьи, каждая до 80 символов")
        public List<String> recommendations;
    }

    public static class CompetitorRelevance {
        @JsonPropertyDescription("Идентификатор материала, например C1")
        public String id;
        @JsonPropertyDescription("Релевантность теме: high, medium или low")
        public String relevance;
    }

    public static class KeywordSelection {
        @JsonPropertyDescription("2-4 основных запроса, под которые оптимизируется статья; первый - главный")
        public List<String> primary;
        @JsonPropertyDescription("4-8 дополнительных запросов, которые стоит раскрыть в тексте")
        public List<String> secondary;
    }

    public static class OutlineDraft {
        @JsonPropertyDescription("Заголовок H1 статьи, содержит главный запрос")
        public String h1;
        @JsonPropertyDescription("Разделы статьи в порядке следования, без введения")
        public List<OutlineItem> sections;
        @JsonPropertyDescription("Минимальный рекомендуемый объем статьи в словах")
        public int minWords;
        @JsonPropertyDescription("Максимальный рекомендуемый объем статьи в словах")
        public int maxWords;
    }

    public static class OutlineItem {
        @JsonPropertyDescription("Уровень заголовка: 2 для раздела H2, 3 для подраздела H3")
        public int level;
        @JsonPropertyDescription("Текст заголовка")
        public String title;
    }
}
