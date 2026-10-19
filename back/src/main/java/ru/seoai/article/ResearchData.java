package ru.seoai.article;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

/** Типы результатов анализа выдачи. Совпадают с DTO фронтенда. */
public final class ResearchData {

    private ResearchData() {
    }

    public enum Level {
        @JsonProperty("high") HIGH,
        @JsonProperty("medium") MEDIUM,
        @JsonProperty("low") LOW
    }

    public enum IntentType {
        @JsonProperty("informational") INFORMATIONAL,
        @JsonProperty("commercial") COMMERCIAL,
        @JsonProperty("transactional") TRANSACTIONAL,
        @JsonProperty("navigational") NAVIGATIONAL
    }

    public record SearchIntent(IntentType type, String description, Level confidence) {
    }

    public record Keyword(String phrase, Kind kind) {

        public enum Kind {
            @JsonProperty("primary") PRIMARY,
            @JsonProperty("secondary") SECONDARY
        }

        public boolean primary() {
            return kind == Kind.PRIMARY;
        }
    }

    public record CompetitorPage(String id, String domain, String title, String url, int position, Level relevance) {
    }

    public record WordRange(int min, int max) {
    }

    public record ArticleOutline(String articleId, List<OutlineSection> sections, WordRange estimatedWords,
            int targetKeywords) {
    }

    public record ResearchProgress(int stage, int total, String label) {
    }
}
