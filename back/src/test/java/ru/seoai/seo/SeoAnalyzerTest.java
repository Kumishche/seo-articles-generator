package ru.seoai.seo;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.junit.jupiter.api.Test;

import ru.seoai.article.Article;
import ru.seoai.article.OutlineSection;
import ru.seoai.article.ResearchData.ArticleOutline;
import ru.seoai.article.ResearchData.Keyword;
import ru.seoai.article.ResearchData.WordRange;
import ru.seoai.article.SeoAnalysis;
import ru.seoai.article.SeoAnalysis.SeoCheck;
import ru.seoai.article.SeoAnalysis.SeoCheck.Status;

class SeoAnalyzerTest {

    private final SeoAnalyzer analyzer = new SeoAnalyzer();

    private static Article article(String title, String html, String meta) {
        Article a = new Article("a1", "CRM для малого бизнеса", null, null, List.of(), "crm", Instant.now());
        a.title(title);
        a.content(html);
        a.metaDescription(meta);
        a.intentCovered(true);
        a.research().keywords(List.of(
                new Keyword("CRM для малого бизнеса", Keyword.Kind.PRIMARY),
                new Keyword("внедрение CRM", Keyword.Kind.SECONDARY)));
        a.research().outline(new ArticleOutline("a1", List.of(new OutlineSection("s-1", 1, title)),
                new WordRange(100, 200), 2));
        return a;
    }

    private static Map<String, Status> statuses(SeoAnalysis seo) {
        return seo.checks().stream().collect(Collectors.toMap(SeoCheck::id, SeoCheck::status));
    }

    private static String body(int filler) {
        return "<p>CRM для малого бизнеса помогает не терять заявки.</p>"
                + "<h2>Зачем нужна</h2><p>" + "Менеджеры видят историю клиента. ".repeat(filler) + "</p>"
                + "<h2>Как выбрать</h2><p>Внедрение CRM стоит начинать с описания процесса. "
                + "CRM для малого бизнеса должна быть простой.</p>";
    }

    @Test
    void goodArticlePassesMostChecks() {
        String meta = "Разбираем, как выбрать CRM для малого бизнеса: какие функции важны, как сравнить решения "
                + "и не переплатить за лишние модули при внедрении системы.";
        SeoAnalysis seo = analyzer.analyze(article("Как выбрать CRM для малого бизнеса", body(80), meta));

        Map<String, Status> s = statuses(seo);
        assertThat(s).containsEntry("intent", Status.PASSED)
                .containsEntry("kw-title", Status.PASSED)
                .containsEntry("kw-intro", Status.PASSED)
                .containsEntry("density", Status.PASSED)
                .containsEntry("length", Status.PASSED)
                .containsEntry("headings", Status.PASSED)
                .containsEntry("meta", Status.PASSED)
                .containsEntry("links", Status.WARNING);
        assertThat(seo.score()).isBetween(95, 98);
        assertThat(seo.verdict()).isEqualTo("Отлично");
        assertThat(seo.keywords()).extracting(SeoAnalysis.KeywordStat::phrase)
                .containsExactly("CRM для малого бизнеса", "внедрение CRM");
    }

    @Test
    void detectsProblems() {
        SeoAnalysis seo = analyzer.analyze(article("Выбор системы", "<p>Коротко.</p><h3>Подраздел</h3>", ""));

        Map<String, Status> s = statuses(seo);
        assertThat(s).containsEntry("kw-title", Status.WARNING)
                .containsEntry("kw-intro", Status.WARNING)
                .containsEntry("length", Status.FAILED)
                .containsEntry("headings", Status.WARNING)
                .containsEntry("meta", Status.FAILED);
        assertThat(seo.score()).isLessThan(50);
        assertThat(seo.verdict()).isEqualTo("Требует доработки");
    }

    @Test
    void internalLinkPassesLinksCheck() {
        String html = body(80) + "<p>Подробнее в <a href=\"/blog/crm-ceny\">статье о ценах</a>.</p>";
        assertThat(statuses(analyzer.analyze(article("CRM для малого бизнеса", html, "x"))))
                .containsEntry("links", Status.PASSED);
    }
}
