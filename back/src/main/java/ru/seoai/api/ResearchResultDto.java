package ru.seoai.api;

import java.time.Instant;
import java.util.List;

import ru.seoai.article.Article;
import ru.seoai.article.ArticleStatus;
import ru.seoai.article.Research;
import ru.seoai.article.ResearchData.ArticleOutline;
import ru.seoai.article.ResearchData.CompetitorPage;
import ru.seoai.article.ResearchData.Keyword;
import ru.seoai.article.ResearchData.ResearchProgress;
import ru.seoai.article.ResearchData.SearchIntent;

public record ResearchResultDto(
        String articleId,
        Research.Status status,
        ArticleStatus articleStatus,
        String generationError,
        ResearchProgress progress,
        Integer serpResultsAnalyzed,
        Integer competitorPagesAnalyzed,
        SearchIntent intent,
        List<Keyword> keywords,
        List<CompetitorPage> competitors,
        List<String> recommendations,
        ArticleOutline outline,
        String error,
        Instant completedAt) {

    public static ResearchResultDto of(Article article) {
        Research r = article.research();
        boolean pending = r.status() == Research.Status.PENDING;
        return new ResearchResultDto(article.id(), r.status(), article.status(), article.generationError(),
                pending ? r.progress() : null, r.serpResultsAnalyzed(),
                r.competitorPagesAnalyzed(), r.intent(), r.keywords(), r.competitors(), r.recommendations(),
                r.outline(), r.error(), r.completedAt());
    }
}
