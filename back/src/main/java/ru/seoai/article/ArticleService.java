package ru.seoai.article;

import java.net.URI;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;

import ru.seoai.api.ArticleDto;
import ru.seoai.api.ArticlePatch;
import ru.seoai.api.ArticleSummary;
import ru.seoai.api.CreateArticleRequest;
import ru.seoai.article.ResearchData.ArticleOutline;
import ru.seoai.common.ApiException;
import ru.seoai.research.ResearchService;
import ru.seoai.seo.SeoAnalyzer;
import ru.seoai.seo.Slugifier;
import ru.seoai.source.FileRepository;

@Service
public class ArticleService {

    private final ArticleRepository articles;
    private final FileRepository files;
    private final ResearchService research;
    private final SeoAnalyzer seoAnalyzer;

    public ArticleService(ArticleRepository articles, FileRepository files, ResearchService research,
            SeoAnalyzer seoAnalyzer) {
        this.articles = articles;
        this.files = files;
        this.research = research;
        this.seoAnalyzer = seoAnalyzer;
    }

    public String create(CreateArticleRequest request) {
        String topic = request.topic().strip();
        Article article = new Article(UUID.randomUUID().toString(), topic, blankToNull(request.requirements()),
                blankToNull(request.draftPlan()), resolveSources(request.sourcesOrEmpty()), Slugifier.slugify(topic),
                Instant.now());
        articles.save(article);
        research.start(article.id());
        return article.id();
    }

    public ArticleDto get(String id) {
        return articles.read(id, ArticleDto::of).orElseThrow(ArticleService::notFound);
    }

    public List<ArticleSummary> list() {
        return articles.readAll(ArticleSummary::of).stream()
                .sorted(Comparator.comparing(ArticleSummary::updatedAt).reversed())
                .toList();
    }

    public ArticleDto update(String id, ArticlePatch patch) {
        return articles.update(id, article -> {
            if (article.status() != ArticleStatus.REVIEW) {
                throw ApiException.conflict("Редактировать можно только сгенерированную статью");
            }
            if (patch.title() != null) article.title(patch.title().strip());
            if (patch.content() != null) article.content(HtmlSanitizer.sanitize(patch.content()));
            if (patch.seoTitle() != null) article.seoTitle(patch.seoTitle().strip());
            if (patch.metaDescription() != null) article.metaDescription(patch.metaDescription().strip());
            if (patch.slug() != null) article.slug(patch.slug());
            article.seo(seoAnalyzer.analyze(article));
            return ArticleDto.of(article);
        }).orElseThrow(ArticleService::notFound);
    }

    public void delete(String id) {
        if (!articles.delete(id)) {
            throw notFound();
        }
    }

    public ArticleOutline saveOutline(String id, List<OutlineSection> sections) {
        List<OutlineSection> valid = OutlineValidator.validate(sections);
        return articles.update(id, article -> {
            requireEditableOutline(article);
            ArticleOutline current = article.research().outline();
            ArticleOutline updated = new ArticleOutline(article.id(), valid, current.estimatedWords(),
                    current.targetKeywords());
            article.research().outline(updated);
            return updated;
        }).orElseThrow(ArticleService::notFound);
    }

    /** Структуру можно менять после анализа, но не во время анализа или генерации. */
    public static void requireEditableOutline(Article article) {
        if (!article.research().isCompleted()) {
            throw ApiException.conflict("Анализ выдачи еще не завершен");
        }
        if (article.status() == ArticleStatus.GENERATING) {
            throw ApiException.conflict("Статья сейчас генерируется");
        }
    }

    public static ApiException notFound() {
        return ApiException.notFound("Статья не найдена");
    }

    /** Файлы подменяются серверными метаданными, ссылки проверяются и дополняются доменом. */
    private List<ArticleSource> resolveSources(List<ArticleSource> sources) {
        List<ArticleSource> result = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (ArticleSource source : sources) {
            ArticleSource resolved = switch (source.type()) {
                case FILE -> files.find(source.id())
                        .orElseThrow(() -> ApiException.badRequest(
                                "Файл «" + source.title() + "» не найден. Загрузите его заново"))
                        .source();
                case LINK -> resolveLink(source);
            };
            String key = resolved.type() == ArticleSource.Type.LINK ? resolved.url() : resolved.id();
            if (seen.add(key)) {
                result.add(resolved);
            }
        }
        return result;
    }

    private static ArticleSource resolveLink(ArticleSource source) {
        String url = source.url() != null ? source.url().strip() : source.title().strip();
        URI uri;
        try {
            uri = URI.create(url);
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Некорректная ссылка: " + url);
        }
        if (uri.getHost() == null || !("http".equals(uri.getScheme()) || "https".equals(uri.getScheme()))) {
            throw ApiException.badRequest("Ссылка должна начинаться с http:// или https://: " + url);
        }
        String domain = uri.getHost().replaceFirst("^www\\.", "");
        Instant addedAt = source.addedAt() != null ? source.addedAt() : Instant.now();
        return new ArticleSource(source.id(), ArticleSource.Type.LINK, url, url, domain, null, null, addedAt);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }
}
