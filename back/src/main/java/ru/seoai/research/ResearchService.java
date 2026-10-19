package ru.seoai.research;

import java.net.URI;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import ru.seoai.ai.AiClient;
import ru.seoai.ai.AiException;
import ru.seoai.api.ResearchResultDto;
import ru.seoai.article.Article;
import ru.seoai.article.ArticleRepository;
import ru.seoai.article.ArticleSource;
import ru.seoai.article.ArticleStatus;
import ru.seoai.article.OutlineSection;
import ru.seoai.article.Research;
import ru.seoai.article.ResearchData.ArticleOutline;
import ru.seoai.article.ResearchData.CompetitorPage;
import ru.seoai.article.ResearchData.IntentType;
import ru.seoai.article.ResearchData.Keyword;
import ru.seoai.article.ResearchData.Level;
import ru.seoai.article.ResearchData.ResearchProgress;
import ru.seoai.article.ResearchData.SearchIntent;
import ru.seoai.article.ResearchData.WordRange;
import ru.seoai.article.SourceMaterial;
import ru.seoai.common.ApiException;
import ru.seoai.config.AppProperties;
import ru.seoai.research.ResearchSchemas.CompetitorRelevance;
import ru.seoai.research.ResearchSchemas.IntentAnalysis;
import ru.seoai.research.ResearchSchemas.KeywordSelection;
import ru.seoai.research.ResearchSchemas.OutlineDraft;
import ru.seoai.research.ResearchSchemas.OutlineItem;
import ru.seoai.source.FileRepository;
import ru.seoai.source.PageFetcher;
import ru.seoai.source.PageFetcher.FetchResult;
import ru.seoai.source.PageFetcher.Page;

/**
 * Асинхронный анализ выдачи. Этапы совпадают с analysisStages во фронтенде,
 * прогресс пишется в статью и отдается через GET /articles/{id}/research.
 */
@Service
public class ResearchService {

    public static final List<String> STAGES = List.of(
            "Анализируем поисковую выдачу...",
            "Изучаем страницы конкурентов...",
            "Определяем поисковый интент...",
            "Подбираем ключевые запросы...",
            "Формируем структуру статьи...");

    private static final Logger log = LoggerFactory.getLogger(ResearchService.class);

    private static final int INTENT_EXCERPT = 1500;
    private static final int OUTLINE_USER_EXCERPT = 800;
    private static final int MAX_PRIMARY = 4;
    private static final int MAX_SECONDARY = 8;

    /** Запуск устарел (статью удалили или анализ перезапустили): результат не нужен. */
    private static final class StaleRunException extends RuntimeException {
        StaleRunException() {
            super(null, null, false, false);
        }
    }

    private record Input(String topic, String requirements, String draftPlan, List<ArticleSource> sources) {
    }

    private final ArticleRepository articles;
    private final FileRepository files;
    private final PageFetcher fetcher;
    private final SearchClient search;
    private final AiClient ai;
    private final ExecutorService executor;
    private final long fetchWaitMs;

    public ResearchService(ArticleRepository articles, FileRepository files, PageFetcher fetcher, SearchClient search,
            AiClient ai, ExecutorService backgroundExecutor, AppProperties properties) {
        this.articles = articles;
        this.files = files;
        this.fetcher = fetcher;
        this.search = search;
        this.ai = ai;
        this.executor = backgroundExecutor;
        this.fetchWaitMs = properties.research().fetchTimeout().toMillis() * 3;
    }

    /** Запускает анализ только что созданной статьи. */
    public void start(String id) {
        launch(id, article -> {
        });
    }

    /** «Повторить анализ»: сбрасывает прошлый результат. */
    public ResearchResultDto restart(String id) {
        launch(id, article -> {
            if (article.status() == ArticleStatus.GENERATING) {
                throw ApiException.conflict("Статья сейчас генерируется");
            }
            if (article.research().status() == Research.Status.PENDING) {
                throw ApiException.conflict("Анализ уже выполняется");
            }
        });
        return get(id);
    }

    public ResearchResultDto get(String id) {
        return articles.read(id, ResearchResultDto::of)
                .orElseThrow(() -> ApiException.notFound("Статья не найдена"));
    }

    private void launch(String id, Consumer<Article> precondition) {
        int run = articles.update(id, article -> {
            precondition.accept(article);
            article.status(ArticleStatus.ANALYZING);
            return article.research().restart(progress(0));
        }).orElseThrow(() -> ApiException.notFound("Статья не найдена"));
        executor.execute(() -> run(id, run));
    }

    private void run(String id, int run) {
        try {
            pipeline(id, run);
        } catch (StaleRunException e) {
            log.debug("Анализ {} #{} устарел", id, run);
        } catch (Exception e) {
            log.warn("Анализ {} завершился ошибкой", id, e);
            String message = e instanceof AiException ? e.getMessage() : "Внутренняя ошибка анализа";
            articles.modify(id, article -> {
                if (article.research().run() != run) return;
                article.research().status(Research.Status.FAILED);
                article.research().progress(null);
                article.research().error(message);
                article.status(ArticleStatus.DRAFT);
            });
        }
    }

    private void pipeline(String id, int run) {
        Input in = articles.read(id, a -> new Input(a.topic(), a.requirements(), a.draftPlan(), a.sources()))
                .orElseThrow(StaleRunException::new);

        // 0. Поисковая выдача
        List<SearchClient.Hit> found = search.search(in.topic());
        advance(id, run, 1, r -> r.serpResultsAnalyzed(found.size()));

        // 1. Страницы конкурентов и материалы пользователя, загружаются параллельно
        List<Future<FetchResult>> competitorFetches = found.stream()
                .map(hit -> executor.submit(() -> fetcher.fetch(hit.url())))
                .toList();
        List<ArticleSource> links = in.sources().stream().filter(s -> s.type() == ArticleSource.Type.LINK).toList();
        List<Future<FetchResult>> linkFetches = links.stream()
                .map(link -> executor.submit(() -> fetcher.fetch(link.url())))
                .toList();

        // Несуществующие страницы (404, нет домена) из выдачи убираем: на них нельзя ссылаться
        List<SearchClient.Hit> hits = new ArrayList<>();
        List<SourceMaterial> competitors = new ArrayList<>();
        int fetched = 0;
        for (int i = 0; i < found.size(); i++) {
            SearchClient.Hit proposed = found.get(i);
            FetchResult result = await(competitorFetches.get(i));
            if (result.status() == FetchResult.Status.NOT_FOUND) {
                log.info("Убираем из выдачи несуществующую страницу {}", proposed.url());
                continue;
            }
            Optional<Page> page = result.pageIfOk().filter(p -> !p.text().isBlank());
            String title = proposed.title() != null ? proposed.title()
                    : result.pageIfOk().map(Page::title).orElseGet(() -> domain(proposed.url()));
            SearchClient.Hit hit = new SearchClient.Hit(title, proposed.url(), proposed.snippet());
            hits.add(hit);
            int n = hits.size();
            if (page.isPresent()) {
                fetched++;
                competitors.add(new SourceMaterial("C" + n, "c-" + n, SourceMaterial.Origin.COMPETITOR,
                        hit.title(), hit.url(), page.get().headings(), page.get().text()));
            } else {
                // Страница есть, но не открылась: опираемся на заголовок и описание из выдачи
                competitors.add(new SourceMaterial("C" + n, "c-" + n, SourceMaterial.Origin.COMPETITOR,
                        hit.title(), hit.url(), List.of(), hit.snippet()));
            }
        }
        if (hits.isEmpty()) {
            throw new AiException("Все найденные страницы недоступны. Повторите анализ");
        }
        List<SourceMaterial> userMaterials = userMaterials(in.sources(), links, linkFetches);
        List<SourceMaterial> materials = new ArrayList<>(competitors);
        materials.addAll(userMaterials);
        int pagesAnalyzed = fetched;
        int resultsAnalyzed = hits.size();
        advance(id, run, 2, r -> {
            r.serpResultsAnalyzed(resultsAnalyzed);
            r.competitorPagesAnalyzed(pagesAnalyzed);
            r.materials(materials);
        });

        // 2. Интент, релевантность конкурентов, рекомендации
        String header = header(in);
        String userBlock = userMaterials.isEmpty() ? ""
                : "\n\nМатериалы пользователя:\n" + MaterialFormatter.format(userMaterials, INTENT_EXCERPT);
        IntentAnalysis intent = ai.complete(Prompts.INTENT,
                header + "\n\nМатериалы из выдачи:\n" + MaterialFormatter.format(competitors, INTENT_EXCERPT) + userBlock,
                IntentAnalysis.class);
        SearchIntent searchIntent = new SearchIntent(
                parse(IntentType.class, intent.intentType, IntentType.INFORMATIONAL),
                nonNull(intent.description),
                parse(Level.class, intent.confidence, Level.MEDIUM));
        List<CompetitorPage> competitorList = competitorPages(hits, intent.competitors);
        List<String> recommendations = intent.recommendations == null ? List.of()
                : intent.recommendations.stream().filter(s -> s != null && !s.isBlank()).map(String::strip).toList();
        advance(id, run, 3, r -> {
            r.intent(searchIntent);
            r.competitors(competitorList);
            r.recommendations(recommendations);
        });

        // 3. Ключевые запросы
        KeywordSelection selection = ai.complete(Prompts.KEYWORDS,
                header + "\n\nИнтент: " + searchIntent.description()
                        + "\n\nЗаголовки материалов из выдачи:\n" + MaterialFormatter.format(competitors, 0),
                KeywordSelection.class);
        List<Keyword> keywords = keywords(selection, in.topic());
        advance(id, run, 4, r -> r.keywords(keywords));

        // 4. Структура
        StringBuilder outlineInput = new StringBuilder(header);
        if (in.draftPlan() != null) {
            outlineInput.append("\n\nПредварительный план пользователя:\n").append(in.draftPlan());
        }
        outlineInput.append("\n\nИнтент: ").append(searchIntent.description())
                .append("\n\nРекомендации:\n- ").append(String.join("\n- ", recommendations))
                .append("\n\nКлючевые запросы: ")
                .append(String.join(", ", keywords.stream().map(Keyword::phrase).toList()))
                .append("\n\nСтруктуры материалов из выдачи:\n").append(MaterialFormatter.format(competitors, 0));
        if (!userMaterials.isEmpty()) {
            outlineInput.append("\n\nМатериалы пользователя:\n")
                    .append(MaterialFormatter.format(userMaterials, OUTLINE_USER_EXCERPT));
        }
        OutlineDraft draft = ai.complete(Prompts.OUTLINE, outlineInput.toString(), OutlineDraft.class);
        ArticleOutline outline = outline(id, draft, in.topic(), keywords.size());

        articles.modify(id, article -> {
            Research r = article.research();
            if (r.run() != run) throw new StaleRunException();
            r.outline(outline);
            r.status(Research.Status.COMPLETED);
            r.progress(null);
            r.completedAt(Instant.now());
            article.status(ArticleStatus.STRUCTURE_READY);
        });
    }

    /** Переход к следующему этапу с сохранением промежуточного результата. */
    private void advance(String id, int run, int stage, Consumer<Research> change) {
        boolean exists = articles.modify(id, article -> {
            Research r = article.research();
            if (r.run() != run) throw new StaleRunException();
            change.accept(r);
            r.progress(progress(stage));
        });
        if (!exists) throw new StaleRunException();
    }

    private static ResearchProgress progress(int stage) {
        return new ResearchProgress(stage, STAGES.size(), STAGES.get(stage));
    }

    private FetchResult await(Future<FetchResult> future) {
        try {
            return future.get(fetchWaitMs, TimeUnit.MILLISECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new StaleRunException();
        } catch (Exception e) {
            future.cancel(true);
            return FetchResult.unavailable();
        }
    }

    private List<SourceMaterial> userMaterials(List<ArticleSource> sources, List<ArticleSource> links,
            List<Future<FetchResult>> linkPages) {
        List<SourceMaterial> result = new ArrayList<>();
        for (int i = 0; i < links.size(); i++) {
            ArticleSource link = links.get(i);
            Optional<Page> page = await(linkPages.get(i)).pageIfOk();
            page.ifPresent(p -> result.add(new SourceMaterial("U" + (result.size() + 1), link.id(),
                    SourceMaterial.Origin.USER, p.title(), link.url(), p.headings(), p.text())));
        }
        for (ArticleSource source : sources) {
            if (source.type() != ArticleSource.Type.FILE) continue;
            files.find(source.id()).ifPresent(f -> result.add(new SourceMaterial("U" + (result.size() + 1),
                    source.id(), SourceMaterial.Origin.USER, source.title(), null, List.of(), f.text())));
        }
        return result;
    }

    private static String domain(String url) {
        return URI.create(url).getHost().replaceFirst("^www\\.", "");
    }

    private static String header(Input in) {
        String header = "Тема статьи: " + in.topic();
        return in.requirements() == null ? header : header + "\nТребования пользователя: " + in.requirements();
    }

    private static List<CompetitorPage> competitorPages(List<SearchClient.Hit> hits, List<CompetitorRelevance> rel) {
        Map<String, Level> relevance = new HashMap<>();
        if (rel != null) {
            for (CompetitorRelevance r : rel) {
                if (r.id != null) relevance.put(r.id.strip().toUpperCase(Locale.ROOT),
                        parse(Level.class, r.relevance, Level.MEDIUM));
            }
        }
        List<CompetitorPage> pages = new ArrayList<>();
        for (int i = 0; i < hits.size(); i++) {
            SearchClient.Hit hit = hits.get(i);
            pages.add(new CompetitorPage("c-" + (i + 1), domain(hit.url()), hit.title(), hit.url(), i + 1,
                    relevance.getOrDefault("C" + (i + 1), Level.MEDIUM)));
        }
        return pages;
    }

    private static List<Keyword> keywords(KeywordSelection selection, String topic) {
        Set<String> seen = new LinkedHashSet<>();
        List<Keyword> result = new ArrayList<>();
        addKeywords(result, seen, selection.primary, Keyword.Kind.PRIMARY, MAX_PRIMARY);
        if (result.isEmpty()) {
            addKeywords(result, seen, List.of(topic), Keyword.Kind.PRIMARY, 1);
        }
        addKeywords(result, seen, selection.secondary, Keyword.Kind.SECONDARY, MAX_SECONDARY);
        return result;
    }

    private static void addKeywords(List<Keyword> out, Set<String> seen, List<String> phrases, Keyword.Kind kind,
            int max) {
        if (phrases == null) return;
        int added = 0;
        for (String phrase : phrases) {
            if (phrase == null || phrase.isBlank() || added == max) continue;
            String clean = phrase.strip().replaceAll("[\"«»]", "");
            if (seen.add(clean.toLowerCase(Locale.ROOT))) {
                out.add(new Keyword(clean, kind));
                added++;
            }
        }
    }

    static ArticleOutline outline(String articleId, OutlineDraft draft, String topic, int keywordCount) {
        List<OutlineSection> sections = new ArrayList<>();
        String h1 = draft.h1 == null || draft.h1.isBlank() ? topic : draft.h1.strip();
        sections.add(new OutlineSection("s-1", 1, h1));
        if (draft.sections != null) {
            for (OutlineItem item : draft.sections) {
                if (item == null || item.title == null || item.title.isBlank()) continue;
                // Подраздел не может стоять первым: он должен принадлежать разделу
                int level = item.level == 3 && sections.size() > 1 ? 3 : 2;
                sections.add(new OutlineSection("s-" + (sections.size() + 1), level, item.title.strip()));
            }
        }
        if (sections.size() == 1) {
            throw new AiException("Модель не предложила разделы статьи");
        }
        int min = Math.max(300, draft.minWords);
        int max = Math.max(min + 200, draft.maxWords);
        return new ArticleOutline(articleId, sections, new WordRange(round(min), round(max)), keywordCount);
    }

    private static int round(int words) {
        return Math.round(words / 100f) * 100;
    }

    static <E extends Enum<E>> E parse(Class<E> type, String value, E fallback) {
        if (value == null) return fallback;
        try {
            return Enum.valueOf(type, value.strip().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return fallback;
        }
    }

    private static String nonNull(String value) {
        return value == null ? "" : value.strip();
    }
}
