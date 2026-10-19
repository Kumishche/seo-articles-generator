package ru.seoai.api;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import ru.seoai.article.ArticleSource;

public record CreateArticleRequest(
        @NotBlank @Size(max = 300) String topic,
        @Size(max = 4000) String requirements,
        @Size(max = 4000) String draftPlan,
        @Size(max = 20) List<@Valid ArticleSource> sources) {

    public List<ArticleSource> sourcesOrEmpty() {
        return sources == null ? List.of() : sources;
    }
}
