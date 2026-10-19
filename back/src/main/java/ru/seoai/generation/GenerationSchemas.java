package ru.seoai.generation;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonPropertyDescription;

/** Форматы ответов LLM при генерации (см. ResearchSchemas). */
public final class GenerationSchemas {

    private GenerationSchemas() {
    }

    public static class DraftArticle {
        @JsonPropertyDescription("Заголовок H1")
        public String title;
        @JsonPropertyDescription("SEO-заголовок для тега title, до 60 символов")
        public String seoTitle;
        @JsonPropertyDescription("Meta description, 140-160 символов")
        public String metaDescription;
        @JsonPropertyDescription("HTML статьи без H1")
        public String contentHtml;
        @JsonPropertyDescription("Идентификаторы использованных материалов, например C1, U2")
        public List<String> usedSourceIds;
        @JsonPropertyDescription("Полностью ли статья отвечает на поисковый интент")
        public boolean intentCovered;
    }

    public static class EditedArticle {
        @JsonPropertyDescription("Отредактированный HTML статьи целиком")
        public String contentHtml;
    }

    public static class ParagraphText {
        @JsonPropertyDescription("Новый текст абзаца")
        public String text;
    }
}
