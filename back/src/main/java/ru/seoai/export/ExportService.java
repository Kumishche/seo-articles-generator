package ru.seoai.export;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Element;
import org.jsoup.nodes.Node;
import org.jsoup.nodes.TextNode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;

import ru.seoai.article.ArticleRepository;
import ru.seoai.article.ArticleService;
import ru.seoai.article.ArticleStatus;
import ru.seoai.common.ApiException;

/** Экспорт сохраненной статьи в HTML, Markdown или обычный текст. */
@Service
public class ExportService {

    public enum Format {
        HTML("html", MediaType.TEXT_HTML),
        MARKDOWN("md", MediaType.TEXT_MARKDOWN),
        TXT("txt", MediaType.TEXT_PLAIN);

        final String extension;
        final MediaType mediaType;

        Format(String extension, MediaType mediaType) {
            this.extension = extension;
            this.mediaType = mediaType;
        }

        public static Format parse(String value) {
            if (value == null || value.isBlank()) return HTML;
            try {
                return valueOf(value.strip().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException e) {
                throw ApiException.badRequest("Неизвестный формат экспорта: " + value + ". Доступны html, markdown, txt");
            }
        }
    }

    public record ExportedFile(String filename, MediaType mediaType, String body) {
    }

    private final ArticleRepository articles;

    public ExportService(ArticleRepository articles) {
        this.articles = articles;
    }

    public ExportedFile export(String id, Format format) {
        return articles.read(id, article -> {
            if (article.status() != ArticleStatus.REVIEW && article.status() != ArticleStatus.PUBLISHED) {
                throw ApiException.conflict("Статья еще не сгенерирована");
            }
            String title = article.title();
            String body = switch (format) {
                case HTML -> htmlDocument(title, article.seoTitle(), article.metaDescription(), article.content());
                case MARKDOWN -> toMarkdown(title, article.content());
                case TXT -> toText(title, article.content());
            };
            return new ExportedFile(article.slug() + "." + format.extension, format.mediaType, body);
        }).orElseThrow(ArticleService::notFound);
    }

    static String htmlDocument(String title, String seoTitle, String description, String html) {
        String head = seoTitle == null || seoTitle.isBlank() ? title : seoTitle;
        return """
                <!doctype html>
                <html lang="ru">
                <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>%s</title>
                <meta name="description" content="%s">
                </head>
                <body>
                <article>
                <h1>%s</h1>
                %s
                </article>
                </body>
                </html>
                """.formatted(escape(head), escape(description), escape(title), html);
    }

    static String toMarkdown(String title, String html) {
        List<String> blocks = new ArrayList<>();
        blocks.add("# " + title);
        for (Element el : Jsoup.parseBodyFragment(html).body().children()) {
            String text = inline(el).strip();
            switch (el.tagName()) {
                case "h2" -> blocks.add("## " + text);
                case "h3" -> blocks.add("### " + text);
                case "ul" -> blocks.add(String.join("\n",
                        el.children().stream().map(li -> "- " + inline(li).strip()).toList()));
                case "ol" -> {
                    List<String> items = new ArrayList<>();
                    for (int i = 0; i < el.children().size(); i++) {
                        items.add((i + 1) + ". " + inline(el.child(i)).strip());
                    }
                    blocks.add(String.join("\n", items));
                }
                case "blockquote" -> blocks.add("> " + text);
                default -> {
                    if (!text.isEmpty()) blocks.add(text);
                }
            }
        }
        return String.join("\n\n", blocks) + "\n";
    }

    private static String inline(Node node) {
        if (node instanceof TextNode t) return t.text();
        if (!(node instanceof Element el)) return "";
        StringBuilder inner = new StringBuilder();
        for (Node child : el.childNodes()) inner.append(inline(child));
        return switch (el.tagName()) {
            case "strong", "b" -> "**" + inner + "**";
            case "em", "i" -> "*" + inner + "*";
            case "a" -> "[" + inner + "](" + el.attr("href") + ")";
            case "br" -> "\n";
            default -> inner.toString();
        };
    }

    static String toText(String title, String html) {
        List<String> blocks = new ArrayList<>();
        blocks.add(title);
        for (Element el : Jsoup.parseBodyFragment(html).body().children()) {
            switch (el.tagName()) {
                case "ul", "ol" -> blocks.add(String.join("\n",
                        el.children().stream().map(li -> "- " + li.text()).toList()));
                default -> {
                    if (!el.text().isBlank()) blocks.add(el.text());
                }
            }
        }
        return String.join("\n\n", blocks) + "\n";
    }

    private static String escape(String value) {
        return (value == null ? "" : value)
                .replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
    }
}
