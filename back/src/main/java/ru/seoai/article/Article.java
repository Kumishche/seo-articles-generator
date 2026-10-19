package ru.seoai.article;

import java.time.Instant;
import java.util.List;

import ru.seoai.article.ResearchData.CompetitorPage;

/**
 * Статья в хранилище. Объект изменяемый: все чтения и изменения идут через
 * {@link ArticleRepository}, который берет блокировку на статью.
 */
public class Article {

    private final String id;
    private final Instant createdAt;
    private final String topic;
    private final String requirements;
    private final String draftPlan;
    private final List<ArticleSource> sources;
    private final Research research = new Research();

    private ArticleStatus status = ArticleStatus.DRAFT;
    private String title;
    private String content = "";
    private String seoTitle;
    private String metaDescription = "";
    private String slug;
    private List<CompetitorPage> usedSources = List.of();
    private SeoAnalysis seo;
    /** Самооценка модели при генерации: раскрыт ли поисковый интент. Нужна для пересчета SEO. */
    private boolean intentCovered;
    /** Причина, по которой не удалась последняя генерация. Сбрасывается при новом запуске */
    private String generationError;
    private Instant updatedAt;

    public Article(String id, String topic, String requirements, String draftPlan, List<ArticleSource> sources,
            String slug, Instant now) {
        this.id = id;
        this.topic = topic;
        this.requirements = requirements;
        this.draftPlan = draftPlan;
        this.sources = List.copyOf(sources);
        this.title = topic;
        this.seoTitle = topic;
        this.slug = slug;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public void touch() {
        updatedAt = Instant.now();
    }

    public String id() { return id; }
    public Instant createdAt() { return createdAt; }
    public String topic() { return topic; }
    public String requirements() { return requirements; }
    public String draftPlan() { return draftPlan; }
    public List<ArticleSource> sources() { return sources; }
    public Research research() { return research; }
    public ArticleStatus status() { return status; }
    public void status(ArticleStatus status) { this.status = status; }
    public String title() { return title; }
    public void title(String title) { this.title = title; }
    public String content() { return content; }
    public void content(String content) { this.content = content; }
    public String seoTitle() { return seoTitle; }
    public void seoTitle(String seoTitle) { this.seoTitle = seoTitle; }
    public String metaDescription() { return metaDescription; }
    public void metaDescription(String metaDescription) { this.metaDescription = metaDescription; }
    public String slug() { return slug; }
    public void slug(String slug) { this.slug = slug; }
    public List<CompetitorPage> usedSources() { return usedSources; }
    public void usedSources(List<CompetitorPage> usedSources) { this.usedSources = List.copyOf(usedSources); }
    public SeoAnalysis seo() { return seo; }
    public void seo(SeoAnalysis seo) { this.seo = seo; }
    public boolean intentCovered() { return intentCovered; }
    public void intentCovered(boolean intentCovered) { this.intentCovered = intentCovered; }
    public String generationError() { return generationError; }
    public void generationError(String generationError) { this.generationError = generationError; }
    public Instant updatedAt() { return updatedAt; }
}
