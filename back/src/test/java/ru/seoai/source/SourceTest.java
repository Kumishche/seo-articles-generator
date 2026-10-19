package ru.seoai.source;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.ByteArrayOutputStream;
import java.nio.charset.Charset;
import java.time.Duration;

import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.jsoup.Jsoup;
import org.junit.jupiter.api.Test;

import ru.seoai.config.AppProperties;
import ru.seoai.source.PageFetcher.Page;

class SourceTest {

    private final PageFetcher fetcher = new PageFetcher(
            new AppProperties(null, null, new AppProperties.Research(10, Duration.ofSeconds(5), 6000)));
    private final TextExtractor extractor = new TextExtractor();

    @Test
    void parsesMainContentWithoutNoise() {
        String html = """
                <html><head><title>Как выбрать CRM</title></head><body>
                <nav><a href="/">Меню</a></nav>
                <article>
                  <h1>Как выбрать CRM</h1>
                  <p>Первый абзац.</p>
                  <h2>Функции</h2>
                  <ul><li><p>Воронка продаж</p></li><li>Отчеты</li></ul>
                  <script>track()</script>
                </article>
                <footer><p>Подвал</p></footer>
                </body></html>""";
        Page page = fetcher.parse("https://example.com/crm", Jsoup.parse(html));

        assertThat(page.title()).isEqualTo("Как выбрать CRM");
        assertThat(page.headings()).containsExactly("H1 Как выбрать CRM", "H2 Функции");
        assertThat(page.text()).isEqualTo("Первый абзац.\nФункции\nВоронка продаж\nОтчеты");
    }

    @Test
    void rejectsPrivateAndNonHttpUrls() {
        assertThat(PageFetcher.isPublicHttpUrl("http://localhost:8080/api")).isFalse();
        assertThat(PageFetcher.isPublicHttpUrl("http://192.168.1.10/")).isFalse();
        assertThat(PageFetcher.isPublicHttpUrl("file:///etc/passwd")).isFalse();
        assertThat(PageFetcher.isPublicHttpUrl("not a url")).isFalse();
        assertThat(PageFetcher.isPublicHttpUrl("https://93.184.215.14/")).isTrue();
    }

    @Test
    void extractsTxtInUtf8AndWindows1251() throws Exception {
        assertThat(extractor.extract(FileFormat.TXT, "﻿Привет,\r\n\r\n\r\n\r\nмир".getBytes("UTF-8")))
                .isEqualTo("Привет,\n\nмир");
        assertThat(extractor.extract(FileFormat.TXT, "Привет".getBytes(Charset.forName("windows-1251"))))
                .isEqualTo("Привет");
    }

    @Test
    void extractsDocx() throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (XWPFDocument doc = new XWPFDocument()) {
            doc.createParagraph().createRun().setText("Заметки о CRM");
            doc.createParagraph().createRun().setText("Второй абзац");
            doc.write(out);
        }
        assertThat(extractor.extract(FileFormat.DOCX, out.toByteArray())).isEqualTo("Заметки о CRM\nВторой абзац");
    }

    @Test
    void detectsFormatByExtension() {
        assertThat(FileFormat.fromFilename("Отчет.PDF")).contains(FileFormat.PDF);
        assertThat(FileFormat.fromFilename("a.doc")).isEmpty();
        assertThat(FileFormat.fromFilename("noext")).isEmpty();
    }
}
