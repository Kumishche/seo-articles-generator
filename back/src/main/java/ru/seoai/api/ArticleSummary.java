package ru.seoai.api;

import java.time.Instant;

import ru.seoai.article.Article;
import ru.seoai.article.ArticleStatus;

public record ArticleSummary(String id, String topic, String title, ArticleStatus status, Integer seoScore,
        Instant createdAt, Instant updatedAt) {

    public static ArticleSummary of(Article a) {
        return new ArticleSummary(a.id(), a.topic(), a.title(), a.status(), a.seo() == null ? null : a.seo().score(),
                a.createdAt(), a.updatedAt());
    }
}
