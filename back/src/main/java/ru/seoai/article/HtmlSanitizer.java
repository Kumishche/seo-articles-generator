package ru.seoai.article;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.safety.Safelist;

/** Оставляет в HTML статьи только теги, которые поддерживает редактор. */
public final class HtmlSanitizer {

    private static final Safelist SAFELIST = new Safelist()
            .addTags("p", "h2", "h3", "ul", "ol", "li", "strong", "em", "b", "i", "a", "blockquote", "br")
            .addAttributes("a", "href")
            .addProtocols("a", "href", "http", "https", "mailto")
            .preserveRelativeLinks(true);

    private static final Document.OutputSettings OUTPUT = new Document.OutputSettings().prettyPrint(false);

    private HtmlSanitizer() {
    }

    public static String sanitize(String html) {
        if (html == null || html.isBlank()) {
            return "";
        }
        // H1 в теле не нужен: заголовок статьи хранится отдельно
        String withoutH1 = html.replaceAll("(?is)<h1[^>]*>.*?</h1>", "");
        // Базовый URI нужен, чтобы относительные внутренние ссылки (/blog/...) не вырезались
        return Jsoup.clean(withoutH1, "https://site.local", SAFELIST, OUTPUT).strip();
    }

    public static String toText(String html) {
        return Jsoup.parse(html == null ? "" : html).text();
    }
}
