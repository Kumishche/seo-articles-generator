package ru.seoai.article;

import java.time.Instant;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Источник, добавленный пользователем: ссылка или загруженный файл. */
public record ArticleSource(
        @NotBlank @Size(max = 100) String id,
        @NotNull Type type,
        @NotBlank @Size(max = 2048) String title,
        @Size(max = 2048) String url,
        String domain,
        Long size,
        String mimeType,
        Instant addedAt) {

    public enum Type {
        @JsonProperty("link") LINK,
        @JsonProperty("file") FILE
    }
}
