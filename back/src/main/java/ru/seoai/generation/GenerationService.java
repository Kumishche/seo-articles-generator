package ru.seoai.generation;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Consumer;
import java.util.stream.Collectors;

import org.jsoup.Jsoup;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import ru.seoai.ai.AiClient;
import ru.seoai.ai.AiException;
import ru.seoai.api.ArticleDto;
import ru.seoai.api.ParagraphActionRequest;
import ru.seoai.article.Article;
import ru.seoai.article.ArticleRepository;
import ru.seoai.article.ArticleService;
import ru.seoai.article.ArticleSource;
import ru.seoai.article.ArticleStatus;
import ru.seoai.article.HtmlSanitizer;
import ru.seoai.article.OutlineSection;
import ru.seoai.article.OutlineValidator;
import ru.seoai.article.Research;
import ru.seoai.article.ResearchData.ArticleOutline;
import ru.seoai.article.ResearchData.CompetitorPage;
import ru.seoai.article.ResearchData.Keyword;
import ru.seoai.article.ResearchData.Level;
import ru.seoai.article.ResearchData.SearchIntent;
import ru.seoai.article.SourceMaterial;
import ru.seoai.common.ApiException;
import ru.seoai.config.AppProperties;
import ru.seoai.generation.GenerationSchemas.DraftArticle;
import ru.seoai.generation.GenerationSchemas.EditedArticle;
import ru.seoai.generation.GenerationSchemas.ParagraphText;
import ru.seoai.research.MaterialFormatter;
import ru.seoai.seo.SeoAnalyzer;
import ru.seoai.seo.Slugifier;

/**
 * Генерация статьи в два прохода: черновик по структуре и материалам,
 * затем редактура (фактчек по материалам и чистка шаблонного стиля).
 */
@Service
public class GenerationService {

    private static final Logger log = LoggerFactory.getLogger(GenerationService.class);

    /** Материалы пользователя важнее выдачи, поэтому их текста в промпт идет больше */
    private static final int USER_EXCERPT_FACTOR = 2;
    private static final int EDITOR_EXCERPT = 2500;
    private static final int FALLBACK_USED_SOURCES = 4;

    /** Снимок данных статьи для генерации: LLM вызывается без блокировки статьи. */
    private record Job(ArticleStatus previousStatus, String topic, String requirements, ArticleOutline outline,
            SearchIntent intent, List<Keyword> keywords, List<String> recommendations,
            List<SourceMaterial> materials, List<CompetitorPage> competitors, List<ArticleSource> sources) {
    }

    private final ArticleRepository articles;
    private final AiClient ai;
    private final SeoAnalyzer seoAnalyzer;
    private final int excerptChars;

    public GenerationService(ArticleRepository articles, AiClient ai, SeoAnalyzer seoAnalyzer,
            AppProperties properties) {
        this.articles = articles;
        this.ai = ai;
        this.seoAnalyzer = seoAnalyzer;
        this.excerptChars = properties.research().pageExcerptChars();
    }

    /** «Сгенерировать статью»: сохраняет переданную структуру и генерирует по ней текст. */
    public ArticleDto generate(String id, List<OutlineSection> sections) {
        List<OutlineSection> valid = OutlineValidator.validate(sections);
        Job job = begin(id, article -> {
            ArticleOutline current = article.research().outline();
            article.research().outline(new ArticleOutline(article.id(), valid, current.estimatedWords(),
                    current.targetKeywords()));
        });
        return produce(id, job);
    }

    /** «Сгенерировать заново»: по сохраненной структуре. */
    public ArticleDto regenerate(String id) {
        return produce(id, begin(id, article -> {
        }));
    }

    public String applyParagraphAction(String id, ParagraphActionRequest request) {
        String context = articles.read(id, a -> "Тема статьи: " + a.title())
                .orElseThrow(ArticleService::notFound);
        ParagraphText result = ai.complete(GenerationPrompts.paragraph(request.action()),
                context + "\n\nАбзац:\n" + request.text().strip(), ParagraphText.class);
        String text = result.text == null ? "" : Jsoup.parse(result.text).text().strip();
        if (text.isEmpty()) {
            throw new AiException("Модель вернула пустой абзац");
        }
        return text;
    }

    private Job begin(String id, Consumer<Article> prepare) {
        return articles.update(id, article -> {
            ArticleService.requireEditableOutline(article);
            prepare.accept(article);
            Research r = article.research();
            Job job = new Job(article.status(), article.topic(), article.requirements(), r.outline(), r.intent(),
                    r.keywords(), r.recommendations(), r.materials(), r.competitors(), article.sources());
            article.status(ArticleStatus.GENERATING);
            article.generationError(null);
            return job;
        }).orElseThrow(ArticleService::notFound);
    }

    private ArticleDto produce(String id, Job job) {
        try {
            DraftArticle draft = ai.complete(GenerationPrompts.WRITER, writerInput(job), DraftArticle.class);
            String draftHtml = HtmlSanitizer.sanitize(draft.contentHtml);
            if (Jsoup.parseBodyFragment(draftHtml).body().text().isBlank()) {
                throw new AiException("Модель вернула пустую статью");
            }
            String html = edit(job, draftHtml);
            List<CompetitorPage> used = usedSources(job, draft.usedSourceIds);

            return articles.update(id, article -> {
                String h1 = job.outline().sections().getFirst().title();
                article.title(h1);
                article.content(html);
                article.seoTitle(blankTo(draft.seoTitle, h1));
                article.metaDescription(blankTo(draft.metaDescription, ""));
                article.slug(Slugifier.slugify(h1));
                article.usedSources(used);
                article.intentCovered(draft.intentCovered);
                article.seo(seoAnalyzer.analyze(article));
                article.status(ArticleStatus.REVIEW);
                return ArticleDto.of(article);
            }).orElseThrow(ArticleService::notFound);
        } catch (RuntimeException e) {
            // Пользователь мог уйти со страницы: ошибку сохраняем, чтобы показать ее при возврате
            String reason = e instanceof AiException || e instanceof ApiException ? e.getMessage()
                    : "Внутренняя ошибка генерации";
            articles.modify(id, article -> {
                if (article.status() == ArticleStatus.GENERATING) {
                    article.status(job.previousStatus());
                    article.generationError(reason);
                }
            });
            throw e;
        }
    }

    /** Второй проход. Если редактор сломал структуру заголовков или упал, остается черновик. */
    private String edit(Job job, String draftHtml) {
        try {
            String input = "Ключевые запросы (сохранить): " + keywordList(job.keywords(), null)
                    + "\n\nМатериалы:\n" + MaterialFormatter.format(job.materials(), EDITOR_EXCERPT)
                    + "\n\nHTML статьи:\n" + draftHtml;
            EditedArticle edited = ai.complete(GenerationPrompts.EDITOR, input, EditedArticle.class);
            String html = HtmlSanitizer.sanitize(edited.contentHtml);
            if (!headings(html).equals(headings(draftHtml))) {
                log.info("Редактура изменила заголовки статьи, оставляем черновик");
                return draftHtml;
            }
            return html;
        } catch (AiException e) {
            log.warn("Редактура не удалась, оставляем черновик: {}", e.getMessage());
            return draftHtml;
        }
    }

    private String writerInput(Job job) {
        StringBuilder in = new StringBuilder("Тема статьи: ").append(job.topic());
        if (job.requirements() != null) {
            in.append("\nТребования пользователя: ").append(job.requirements());
        }
        List<OutlineSection> sections = job.outline().sections();
        in.append("\n\nЗаголовок H1: ").append(sections.getFirst().title()).append("\n\nСтруктура:\n");
        for (OutlineSection s : sections.subList(1, sections.size())) {
            in.append(s.level() == 2 ? "H2 " : "    H3 ").append(s.title()).append('\n');
        }
        if (job.intent() != null) {
            in.append("\nПоисковый интент: ").append(job.intent().description());
        }
        in.append("\nОсновные запросы (первый - главный): ")
                .append(keywordList(job.keywords(), Keyword.Kind.PRIMARY));
        in.append("\nДополнительные запросы: ").append(keywordList(job.keywords(), Keyword.Kind.SECONDARY));
        if (job.recommendations() != null && !job.recommendations().isEmpty()) {
            in.append("\nРекомендации по содержанию:\n- ").append(String.join("\n- ", job.recommendations()));
        }
        in.append("\nОбъем: ").append(job.outline().estimatedWords().min()).append('-')
                .append(job.outline().estimatedWords().max()).append(" слов");

        List<SourceMaterial> user = job.materials().stream()
                .filter(m -> m.origin() == SourceMaterial.Origin.USER).toList();
        List<SourceMaterial> competitors = job.materials().stream()
                .filter(m -> m.origin() == SourceMaterial.Origin.COMPETITOR).toList();
        if (!user.isEmpty()) {
            in.append("\n\nМатериалы пользователя:\n")
                    .append(MaterialFormatter.format(user, excerptChars * USER_EXCERPT_FACTOR));
        }
        in.append("\n\nМатериалы из выдачи:\n").append(MaterialFormatter.format(competitors, excerptChars));
        return in.toString();
    }

    /**
     * Источники, на которые сослалась модель: страницы конкурентов и ссылки пользователя.
     * Файлы в список не попадают: у них нет адреса.
     */
    private static List<CompetitorPage> usedSources(Job job, List<String> ids) {
        Map<String, SourceMaterial> byId = job.materials().stream()
                .collect(Collectors.toMap(m -> m.id().toUpperCase(Locale.ROOT), m -> m, (a, b) -> a));
        Map<String, CompetitorPage> competitors = job.competitors() == null ? Map.of()
                : job.competitors().stream().collect(Collectors.toMap(CompetitorPage::id, c -> c, (a, b) -> a));

        List<CompetitorPage> used = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (String raw : ids == null ? List.<String>of() : ids) {
            SourceMaterial m = raw == null ? null : byId.get(raw.strip().toUpperCase(Locale.ROOT));
            if (m == null || m.url() == null || !seen.add(m.sourceId())) continue;
            if (m.origin() == SourceMaterial.Origin.COMPETITOR && competitors.containsKey(m.sourceId())) {
                used.add(competitors.get(m.sourceId()));
            } else if (m.origin() == SourceMaterial.Origin.USER) {
                String domain = job.sources().stream().filter(s -> s.id().equals(m.sourceId()))
                        .map(ArticleSource::domain).findFirst().orElse("");
                used.add(new CompetitorPage(m.sourceId(), domain, m.title(), m.url(), 0, Level.HIGH));
            }
        }
        if (used.isEmpty() && job.competitors() != null) {
            job.competitors().stream().filter(c -> c.relevance() == Level.HIGH)
                    .limit(FALLBACK_USED_SOURCES).forEach(used::add);
        }
        return used;
    }

    private static List<String> headings(String html) {
        return Jsoup.parseBodyFragment(html).body().select("h2, h3").stream()
                .map(h -> h.tagName() + ":" + h.text().strip().toLowerCase(Locale.ROOT))
                .toList();
    }

    private static String keywordList(List<Keyword> keywords, Keyword.Kind kind) {
        if (keywords == null) return "";
        return keywords.stream()
                .filter(k -> kind == null || k.kind() == kind)
                .map(Keyword::phrase)
                .collect(Collectors.joining(", "));
    }

    private static String blankTo(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.strip();
    }
}
