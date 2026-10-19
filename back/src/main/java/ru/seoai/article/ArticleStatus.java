package ru.seoai.article;

import com.fasterxml.jackson.annotation.JsonProperty;

public enum ArticleStatus {
    /** Анализ не запускался или завершился ошибкой */
    @JsonProperty("draft") DRAFT,
    @JsonProperty("analyzing") ANALYZING,
    @JsonProperty("structure_ready") STRUCTURE_READY,
    @JsonProperty("generating") GENERATING,
    @JsonProperty("review") REVIEW,
    /** В этой версии не используется: публикации на сайт нет */
    @JsonProperty("published") PUBLISHED
}
