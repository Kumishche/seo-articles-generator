package ru.seoai.export;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class ExportServiceTest {

    private static final String HTML = "<p>Вступление с <strong>важным</strong> и <a href=\"/x\">ссылкой</a>.</p>"
            + "<h2>Раздел</h2><ul><li>первый</li><li><em>второй</em></li></ul>"
            + "<h3>Подраздел</h3><ol><li>шаг</li><li>еще шаг</li></ol><blockquote>Цитата</blockquote>";

    @Test
    void markdownMatchesFrontendFormat() {
        assertThat(ExportService.toMarkdown("Заголовок", HTML)).isEqualTo("""
                # Заголовок

                Вступление с **важным** и [ссылкой](/x).

                ## Раздел

                - первый
                - *второй*

                ### Подраздел

                1. шаг
                2. еще шаг

                > Цитата
                """);
    }

    @Test
    void plainTextKeepsBlocks() {
        assertThat(ExportService.toText("Заголовок", HTML))
                .startsWith("Заголовок\n\nВступление с важным и ссылкой.\n\nРаздел\n\n- первый\n- второй");
    }

    @Test
    void htmlDocumentEscapesHead() {
        String doc = ExportService.htmlDocument("A & B", "SEO \"title\"", "Описание <тест>", "<p>x</p>");
        assertThat(doc).contains("<title>SEO &quot;title&quot;</title>")
                .contains("content=\"Описание &lt;тест&gt;\"")
                .contains("<h1>A &amp; B</h1>")
                .contains("<p>x</p>");
    }
}
