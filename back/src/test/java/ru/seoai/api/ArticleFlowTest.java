package ru.seoai.api;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.startsWith;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.jayway.jsonpath.JsonPath;

import ru.seoai.ai.AiClient;
import ru.seoai.ai.AiException;
import ru.seoai.ai.WebSearchResult;
import ru.seoai.generation.GenerationSchemas.DraftArticle;
import ru.seoai.generation.GenerationSchemas.EditedArticle;
import ru.seoai.generation.GenerationSchemas.ParagraphText;
import ru.seoai.research.ResearchSchemas.CompetitorRelevance;
import ru.seoai.research.ResearchSchemas.IntentAnalysis;
import ru.seoai.research.ResearchSchemas.KeywordSelection;
import ru.seoai.research.ResearchSchemas.OutlineDraft;
import ru.seoai.research.ResearchSchemas.OutlineItem;
import ru.seoai.research.ResearchSchemas.SerpHit;
import ru.seoai.research.ResearchSchemas.SerpResults;
import ru.seoai.source.PageFetcher;
import ru.seoai.source.PageFetcher.FetchResult;
import ru.seoai.source.PageFetcher.Page;

/** Полный сценарий фронтенда на заглушках OpenAI и загрузки страниц. */
@SpringBootTest
@AutoConfigureMockMvc
class ArticleFlowTest {

    private static final String ARTICLE_HTML = "<h1>лишний</h1><p>CRM для малого бизнеса помогает не терять заявки.</p>"
            + "<h2>Зачем нужна CRM</h2><p>Текст раздела.</p><script>alert(1)</script>"
            + "<h2>Как выбрать CRM</h2><h3>Функции</h3><p>Еще текст.</p>";

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private AiClient ai;

    @MockitoBean
    private PageFetcher fetcher;

    @BeforeEach
    void stubs() {
        SerpResults serp = new SerpResults();
        serp.results = List.of(hit("Лучшие CRM", "https://vc.ru/crm?utm_source=openai"),
                hit("Удаленная статья", "https://gone.ru/crm"),
                hit("Как выбрать CRM", "https://habr.com/crm"),
                hit("Дубль", "https://vc.ru/crm"));
        when(ai.completeWithWebSearch(anyString(), anyString(), eq(SerpResults.class)))
                .thenReturn(new WebSearchResult<>(serp, List.of()));

        when(fetcher.fetch(anyString())).thenReturn(FetchResult.unavailable());
        when(fetcher.fetch("https://vc.ru/crm")).thenReturn(FetchResult.ok(
                new Page("https://vc.ru/crm", "Лучшие CRM", List.of("H2 Функции", "H2 Цены"), "Текст про CRM.")));
        when(fetcher.fetch("https://gone.ru/crm")).thenReturn(FetchResult.notFound());

        IntentAnalysis intent = new IntentAnalysis();
        intent.intentType = "informational";
        intent.description = "Понять, как выбрать CRM.";
        intent.confidence = "HIGH";
        CompetitorRelevance rel = new CompetitorRelevance();
        rel.id = "C1";
        rel.relevance = "high";
        intent.competitors = List.of(rel);
        intent.recommendations = List.of("Добавить сравнение", " ");
        when(ai.complete(anyString(), anyString(), eq(IntentAnalysis.class))).thenReturn(intent);

        KeywordSelection keywords = new KeywordSelection();
        keywords.primary = List.of("CRM для малого бизнеса", "«выбор CRM»");
        keywords.secondary = List.of("функции CRM", "crm для малого бизнеса");
        when(ai.complete(anyString(), anyString(), eq(KeywordSelection.class))).thenReturn(keywords);

        OutlineDraft outline = new OutlineDraft();
        outline.h1 = "Как выбрать CRM для малого бизнеса";
        outline.sections = List.of(item(3, "Зачем нужна CRM"), item(2, "Как выбрать CRM"), item(3, "Функции"),
                item(2, " "));
        outline.minWords = 1234;
        outline.maxWords = 900;
        when(ai.complete(anyString(), anyString(), eq(OutlineDraft.class))).thenReturn(outline);

        DraftArticle draft = new DraftArticle();
        draft.title = "Как выбрать CRM для малого бизнеса";
        draft.seoTitle = "Как выбрать CRM для малого бизнеса";
        draft.metaDescription = "Описание";
        draft.contentHtml = ARTICLE_HTML;
        draft.usedSourceIds = List.of("c1", "C2", "U9");
        draft.intentCovered = true;
        when(ai.complete(anyString(), anyString(), eq(DraftArticle.class))).thenReturn(draft);

        // Редактор переименовал заголовок - должен остаться черновик
        EditedArticle edited = new EditedArticle();
        edited.contentHtml = ARTICLE_HTML.replace("Зачем нужна CRM", "Другое");
        when(ai.complete(anyString(), anyString(), eq(EditedArticle.class))).thenReturn(edited);

        ParagraphText paragraph = new ParagraphText();
        paragraph.text = "<p>Новый текст абзаца.</p>";
        when(ai.complete(anyString(), anyString(), eq(ParagraphText.class))).thenReturn(paragraph);
    }

    @Test
    void fullFlow() throws Exception {
        // 1. Файл-источник
        String fileJson = mvc.perform(multipart("/api/files").file(new MockMultipartFile("file", "notes.txt",
                        "text/plain", "Наши заметки о CRM".getBytes(StandardCharsets.UTF_8))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value("file"))
                .andExpect(jsonPath("$.title").value("notes.txt"))
                .andReturn().getResponse().getContentAsString();
        String fileId = JsonPath.read(fileJson, "$.id");

        // 2. Статья
        String created = mvc.perform(post("/api/articles").contentType(MediaType.APPLICATION_JSON).content("""
                        {"topic": "  CRM для малого бизнеса ", "requirements": "",
                         "sources": [
                           {"id": "%s", "type": "file", "title": "notes.txt", "addedAt": "2026-10-19T10:00:00Z"},
                           {"id": "link-1", "type": "link", "title": "https://www.cnews.ru/crm",
                            "url": "https://www.cnews.ru/crm", "addedAt": "2026-10-19T10:00:00Z"}
                         ]}
                        """.formatted(fileId)))
                .andExpect(status().isAccepted())
                .andReturn().getResponse().getContentAsString();
        String id = JsonPath.read(created, "$.id");

        // 3. Анализ
        String research = awaitResearch(id);
        assertThat((Integer) JsonPath.read(research, "$.serpResultsAnalyzed")).isEqualTo(2);
        assertThat((Integer) JsonPath.read(research, "$.competitorPagesAnalyzed")).isEqualTo(1);
        assertThat((String) JsonPath.read(research, "$.competitors[0].url")).isEqualTo("https://vc.ru/crm");
        assertThat((String) JsonPath.read(research, "$.competitors[0].domain")).isEqualTo("vc.ru");
        assertThat((String) JsonPath.read(research, "$.competitors[0].relevance")).isEqualTo("high");
        assertThat((String) JsonPath.read(research, "$.competitors[1].relevance")).isEqualTo("medium");
        // Несуществующая страница убрана, нумерация сплошная
        assertThat((String) JsonPath.read(research, "$.competitors[1].url")).isEqualTo("https://habr.com/crm");
        assertThat((Integer) JsonPath.read(research, "$.competitors[1].position")).isEqualTo(2);
        assertThat((String) JsonPath.read(research, "$.articleStatus")).isEqualTo("structure_ready");
        assertThat((List<String>) JsonPath.read(research, "$.keywords[*].phrase"))
                .containsExactly("CRM для малого бизнеса", "выбор CRM", "функции CRM");
        assertThat((List<String>) JsonPath.read(research, "$.recommendations")).containsExactly("Добавить сравнение");
        assertThat((List<Integer>) JsonPath.read(research, "$.outline.sections[*].level")).containsExactly(1, 2, 2, 3);
        assertThat((Integer) JsonPath.read(research, "$.outline.estimatedWords.min")).isEqualTo(1200);
        assertThat((Integer) JsonPath.read(research, "$.outline.estimatedWords.max")).isEqualTo(1400);
        assertThat((Object) JsonPath.read(research, "$.progress")).isNull();

        mvc.perform(get("/api/articles/" + id)).andExpect(jsonPath("$.status").value("structure_ready"))
                .andExpect(jsonPath("$.topic").value("CRM для малого бизнеса"))
                .andExpect(jsonPath("$.requirements").doesNotExist())
                .andExpect(jsonPath("$.sources", hasSize(2)))
                .andExpect(jsonPath("$.sources[1].domain").value("cnews.ru"));

        // 4. Редактирование до генерации запрещено
        mvc.perform(put("/api/articles/" + id).contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"x\"}"))
                .andExpect(status().isConflict());

        // 5. Черновик структуры
        String sections = """
                {"sections": [
                  {"id": "s-1", "level": 1, "title": "Как выбрать CRM для малого бизнеса"},
                  {"id": "s-2", "level": 2, "title": "Зачем нужна CRM "},
                  {"id": "s-3", "level": 2, "title": "Как выбрать CRM"},
                  {"id": "s-4", "level": 3, "title": "Функции"}
                ]}""";
        mvc.perform(put("/api/articles/" + id + "/outline").contentType(MediaType.APPLICATION_JSON).content(sections))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sections[1].title").value("Зачем нужна CRM"))
                .andExpect(jsonPath("$.estimatedWords.min").value(1200));

        // 6. Генерация
        mvc.perform(post("/api/articles/" + id + "/generate").contentType(MediaType.APPLICATION_JSON).content(sections))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("review"))
                .andExpect(jsonPath("$.title").value("Как выбрать CRM для малого бизнеса"))
                .andExpect(jsonPath("$.slug").value("kak-vybrat-crm-dlya-malogo-biznesa"))
                .andExpect(jsonPath("$.content", containsString("<h2>Зачем нужна CRM</h2>")))
                .andExpect(jsonPath("$.content", startsWith("<p>CRM")))
                .andExpect(jsonPath("$.content").value(org.hamcrest.Matchers.not(containsString("script"))))
                .andExpect(jsonPath("$.usedSources", hasSize(2)))
                .andExpect(jsonPath("$.usedSources[0].id").value("c-1"))
                .andExpect(jsonPath("$.usedSources[1].id").value("c-2"))
                .andExpect(jsonPath("$.seo.maxScore").value(100))
                .andExpect(jsonPath("$.seo.checks", hasSize(8)));

        // 7. Автосохранение пересчитывает SEO
        String meta = "М".repeat(150);
        mvc.perform(put("/api/articles/" + id).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"metaDescription\": \"" + meta + "\", \"content\": \"<p>Новый <b>текст</b></p>\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("<p>Новый <b>текст</b></p>"))
                .andExpect(jsonPath("$.seo.checks[?(@.id == 'meta')].status").value("passed"));
        mvc.perform(put("/api/articles/" + id).contentType(MediaType.APPLICATION_JSON).content("{\"slug\":\"Плохой\"}"))
                .andExpect(status().isBadRequest());

        // 8. AI-правка абзаца
        mvc.perform(post("/api/articles/" + id + "/paragraph-actions").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"action\": \"shorten\", \"text\": \"Старый текст.\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.text").value("Новый текст абзаца."));

        // 9. Экспорт
        mvc.perform(get("/api/articles/" + id + "/export").param("format", "markdown"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition",
                        containsString("kak-vybrat-crm-dlya-malogo-biznesa.md")))
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_MARKDOWN))
                .andExpect(content().string(startsWith("# Как выбрать CRM для малого бизнеса\n\nНовый **текст**")));
        mvc.perform(get("/api/articles/" + id + "/export").param("format", "docx"))
                .andExpect(status().isBadRequest());

        // 10. Список и удаление
        mvc.perform(get("/api/articles")).andExpect(jsonPath("$[?(@.id == '" + id + "')].seoScore").exists());
        mvc.perform(delete("/api/articles/" + id)).andExpect(status().isNoContent());
        mvc.perform(get("/api/articles/" + id)).andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("Статья не найдена"));
    }

    @Test
    void researchFailureIsReported() throws Exception {
        when(ai.completeWithWebSearch(anyString(), anyString(), eq(SerpResults.class)))
                .thenThrow(new AiException("Не задан OPENAI_API_KEY"));
        String id = createArticle();

        String research = awaitResearch(id);
        assertThat((String) JsonPath.read(research, "$.status")).isEqualTo("failed");
        assertThat((String) JsonPath.read(research, "$.error")).isEqualTo("Не задан OPENAI_API_KEY");
        mvc.perform(get("/api/articles/" + id)).andExpect(jsonPath("$.status").value("draft"));
        mvc.perform(post("/api/articles/" + id + "/regenerate")).andExpect(status().isConflict());

        // Повторный анализ после исправления ошибки
        SerpResults serp = new SerpResults();
        serp.results = List.of(hit("Лучшие CRM", "https://vc.ru/crm"));
        when(ai.completeWithWebSearch(anyString(), anyString(), eq(SerpResults.class)))
                .thenReturn(new WebSearchResult<>(serp, List.of()));
        mvc.perform(post("/api/articles/" + id + "/research")).andExpect(status().isAccepted());
        assertThat((String) JsonPath.read(awaitResearch(id), "$.status")).isEqualTo("completed");
    }

    @Test
    void generationFailureRestoresStatus() throws Exception {
        String id = createArticle();
        awaitResearch(id);
        when(ai.complete(anyString(), anyString(), eq(DraftArticle.class)))
                .thenThrow(new AiException("rate limit"));

        mvc.perform(post("/api/articles/" + id + "/regenerate"))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.detail").value("rate limit"));
        mvc.perform(get("/api/articles/" + id)).andExpect(jsonPath("$.status").value("structure_ready"));
        // Ошибка сохраняется: пользователь мог уйти со страницы, пока шла генерация
        mvc.perform(get("/api/articles/" + id + "/research"))
                .andExpect(jsonPath("$.articleStatus").value("structure_ready"))
                .andExpect(jsonPath("$.generationError").value("rate limit"));
    }

    @Test
    void generationInProgressIsVisibleInResearch() throws Exception {
        String id = createArticle();
        awaitResearch(id);
        CountDownLatch started = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        DraftArticle draft = ai.complete("", "", DraftArticle.class);
        when(ai.complete(anyString(), anyString(), eq(DraftArticle.class))).thenAnswer(inv -> {
            started.countDown();
            release.await(10, TimeUnit.SECONDS);
            return draft;
        });

        CompletableFuture<Integer> generation = CompletableFuture.supplyAsync(() -> {
            try {
                return mvc.perform(post("/api/articles/" + id + "/regenerate")).andReturn().getResponse().getStatus();
            } catch (Exception e) {
                throw new IllegalStateException(e);
            }
        });
        assertThat(started.await(10, TimeUnit.SECONDS)).isTrue();

        mvc.perform(get("/api/articles/" + id + "/research"))
                .andExpect(jsonPath("$.articleStatus").value("generating"))
                .andExpect(jsonPath("$.generationError").doesNotExist());
        mvc.perform(post("/api/articles/" + id + "/generate").contentType(MediaType.APPLICATION_JSON).content("""
                        {"sections": [{"id": "s-1", "level": 1, "title": "H1"}, {"id": "s-2", "level": 2, "title": "x"}]}"""))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("Статья сейчас генерируется"));

        release.countDown();
        assertThat(generation.get(10, TimeUnit.SECONDS)).isEqualTo(200);
        mvc.perform(get("/api/articles/" + id + "/research")).andExpect(jsonPath("$.articleStatus").value("review"));
    }

    @Test
    void validatesInput() throws Exception {
        mvc.perform(post("/api/articles").contentType(MediaType.APPLICATION_JSON).content("{\"topic\": \" \"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/articles").contentType(MediaType.APPLICATION_JSON).content("""
                        {"topic": "x", "sources": [{"id": "file-x", "type": "file", "title": "a.pdf"}]}"""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail", containsString("a.pdf")));
        mvc.perform(post("/api/articles").contentType(MediaType.APPLICATION_JSON).content("""
                        {"topic": "x", "sources": [{"id": "l", "type": "link", "title": "ftp://a.ru"}]}"""))
                .andExpect(status().isBadRequest());

        mvc.perform(multipart("/api/files").file(new MockMultipartFile("file", "a.exe", null, new byte[] {1})))
                .andExpect(status().isUnsupportedMediaType());
        mvc.perform(multipart("/api/files").file(new MockMultipartFile("file", "a.pdf", null, new byte[] {1, 2})))
                .andExpect(status().isBadRequest());
        mvc.perform(delete("/api/files/nope")).andExpect(status().isNotFound());

        String id = createArticle();
        awaitResearch(id);
        mvc.perform(post("/api/articles/" + id + "/generate").contentType(MediaType.APPLICATION_JSON).content("""
                        {"sections": [{"id": "s-1", "level": 1, "title": "H1"}, {"id": "s-2", "level": 3, "title": "x"}]}"""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("Добавьте хотя бы один раздел H2"));
        mvc.perform(post("/api/articles/" + id + "/generate").contentType(MediaType.APPLICATION_JSON).content("""
                        {"sections": [{"id": "s-1", "level": 1, "title": "H1"}, {"id": "s-2", "level": 2, "title": " "}]}"""))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/articles/" + id + "/export")).andExpect(status().isConflict());
        mvc.perform(get("/api/articles/missing/research")).andExpect(status().isNotFound());
    }

    private String createArticle() throws Exception {
        String created = mvc.perform(post("/api/articles").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"topic\": \"CRM для малого бизнеса\"}"))
                .andExpect(status().isAccepted())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(created, "$.id");
    }

    private String awaitResearch(String id) throws Exception {
        for (int i = 0; i < 100; i++) {
            String body = mvc.perform(get("/api/articles/" + id + "/research"))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            if (!"pending".equals(JsonPath.read(body, "$.status"))) {
                return body;
            }
            Thread.sleep(50);
        }
        throw new AssertionError("Анализ не завершился");
    }

    private static SerpHit hit(String title, String url) {
        SerpHit hit = new SerpHit();
        hit.title = title;
        hit.url = url;
        hit.snippet = "Описание";
        return hit;
    }

    private static OutlineItem item(int level, String title) {
        OutlineItem item = new OutlineItem();
        item.level = level;
        item.title = title;
        return item;
    }
}
