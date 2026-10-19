package ru.seoai.article;

import java.time.Instant;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import ru.seoai.article.ResearchData.ArticleOutline;
import ru.seoai.article.ResearchData.CompetitorPage;
import ru.seoai.article.ResearchData.Keyword;
import ru.seoai.article.ResearchData.ResearchProgress;
import ru.seoai.article.ResearchData.SearchIntent;

/** Состояние и результат анализа выдачи. Изменяется только под блокировкой статьи. */
public class Research {

    public enum Status {
        @JsonProperty("pending") PENDING,
        @JsonProperty("completed") COMPLETED,
        @JsonProperty("failed") FAILED
    }

    /** Номер запуска: результат устаревшего запуска (после «Повторить анализ») отбрасывается. */
    private int run;
    private Status status = Status.PENDING;
    private ResearchProgress progress;
    private Integer serpResultsAnalyzed;
    private Integer competitorPagesAnalyzed;
    private SearchIntent intent;
    private List<Keyword> keywords;
    private List<CompetitorPage> competitors;
    private List<String> recommendations;
    private ArticleOutline outline;
    private String error;
    private Instant completedAt;
    /** Тексты источников для генерации. Клиенту не отдаются. */
    private List<SourceMaterial> materials = List.of();

    /** Сбрасывает результат и начинает новый запуск. Возвращает его номер. */
    public int restart(ResearchProgress initial) {
        run++;
        status = Status.PENDING;
        progress = initial;
        serpResultsAnalyzed = null;
        competitorPagesAnalyzed = null;
        intent = null;
        keywords = null;
        competitors = null;
        recommendations = null;
        outline = null;
        error = null;
        completedAt = null;
        materials = List.of();
        return run;
    }

    public boolean isCompleted() {
        return status == Status.COMPLETED;
    }

    public int run() { return run; }
    public Status status() { return status; }
    public void status(Status status) { this.status = status; }
    public ResearchProgress progress() { return progress; }
    public void progress(ResearchProgress progress) { this.progress = progress; }
    public Integer serpResultsAnalyzed() { return serpResultsAnalyzed; }
    public void serpResultsAnalyzed(Integer value) { this.serpResultsAnalyzed = value; }
    public Integer competitorPagesAnalyzed() { return competitorPagesAnalyzed; }
    public void competitorPagesAnalyzed(Integer value) { this.competitorPagesAnalyzed = value; }
    public SearchIntent intent() { return intent; }
    public void intent(SearchIntent intent) { this.intent = intent; }
    public List<Keyword> keywords() { return keywords; }
    public void keywords(List<Keyword> keywords) { this.keywords = keywords; }
    public List<CompetitorPage> competitors() { return competitors; }
    public void competitors(List<CompetitorPage> competitors) { this.competitors = competitors; }
    public List<String> recommendations() { return recommendations; }
    public void recommendations(List<String> recommendations) { this.recommendations = recommendations; }
    public ArticleOutline outline() { return outline; }
    public void outline(ArticleOutline outline) { this.outline = outline; }
    public String error() { return error; }
    public void error(String error) { this.error = error; }
    public Instant completedAt() { return completedAt; }
    public void completedAt(Instant completedAt) { this.completedAt = completedAt; }
    public List<SourceMaterial> materials() { return materials; }
    public void materials(List<SourceMaterial> materials) { this.materials = List.copyOf(materials); }
}
