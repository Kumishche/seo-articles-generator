package ru.seoai.api;

import java.time.Instant;
import java.util.List;

import ru.seoai.article.Article;
import ru.seoai.article.ArticleSource;
import ru.seoai.article.ArticleStatus;
import ru.seoai.article.ResearchData.CompetitorPage;
import ru.seoai.article.SeoAnalysis;

public record ArticleDto(
        String id,
        String topic,
        String requirements,
        String draftPlan,
        ArticleStatus status,
        String title,
        String content,
        String seoTitle,
        String metaDescription,
        String slug,
        List<ArticleSource> sources,
        List<CompetitorPage> usedSources,
        SeoAnalysis seo,
        Instant createdAt,
        Instant updatedAt) {

    public static ArticleDto of(Article a) {
        return new ArticleDto(a.id(), a.topic(), a.requirements(), a.draftPlan(), a.status(), a.title(), a.content(),
                a.seoTitle(), a.metaDescription(), a.slug(), a.sources(), a.usedSources(), a.seo(), a.createdAt(),
                a.updatedAt());
    }
}
