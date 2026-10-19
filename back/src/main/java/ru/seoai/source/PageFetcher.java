package ru.seoai.source;

import java.net.InetAddress;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.UnknownHostException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.jsoup.HttpStatusException;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import ru.seoai.config.AppProperties;

/** Загружает веб-страницу и выделяет из нее заголовки и основной текст. */
@Component
public class PageFetcher {

    private static final Logger log = LoggerFactory.getLogger(PageFetcher.class);

    private static final String USER_AGENT =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";
    private static final int MAX_BODY_BYTES = 3 * 1024 * 1024;
    private static final String NOISE =
            "script, style, noscript, iframe, svg, form, nav, header, footer, aside, [role=navigation], [aria-hidden=true]";

    /**
     * @param headings заголовки H1-H3 в виде «H2 Текст»
     * @param text     основной текст, блоки разделены переводом строки
     */
    public record Page(String url, String title, List<String> headings, String text) {
    }

    private final int timeoutMs;
    private final int maxTextChars;

    public PageFetcher(AppProperties properties) {
        this.timeoutMs = (int) properties.research().fetchTimeout().toMillis();
        this.maxTextChars = properties.research().pageExcerptChars() * 3;
    }

    /**
     * Результат загрузки. NOT_FOUND - адреса нет (404, 410, домен не существует): такую ссылку
     * показывать нельзя. UNAVAILABLE - страница есть, но текст получить не удалось (403, таймаут):
     * ссылка рабочая, анализ опирается на описание из выдачи.
     */
    public record FetchResult(Status status, Page page) {

        public enum Status {
            OK, NOT_FOUND, UNAVAILABLE
        }

        public static FetchResult ok(Page page) {
            return new FetchResult(Status.OK, page);
        }

        public static FetchResult notFound() {
            return new FetchResult(Status.NOT_FOUND, null);
        }

        public static FetchResult unavailable() {
            return new FetchResult(Status.UNAVAILABLE, null);
        }

        public Optional<Page> pageIfOk() {
            return Optional.ofNullable(page);
        }
    }

    public FetchResult fetch(String url) {
        if (!isPublicHttpUrl(url)) {
            log.info("Пропускаем адрес {}: не публичный http(s) или домен не существует", url);
            return FetchResult.notFound();
        }
        try {
            Document doc = Jsoup.connect(url)
                    .userAgent(USER_AGENT)
                    .header("Accept-Language", "ru-RU,ru;q=0.9,en;q=0.6")
                    .timeout(timeoutMs)
                    .maxBodySize(MAX_BODY_BYTES)
                    .followRedirects(true)
                    .get();
            return FetchResult.ok(parse(url, doc));
        } catch (HttpStatusException e) {
            log.info("Не удалось загрузить {}: HTTP {}", url, e.getStatusCode());
            return e.getStatusCode() == 404 || e.getStatusCode() == 410
                    ? FetchResult.notFound()
                    : FetchResult.unavailable();
        } catch (UnknownHostException | MalformedURLException | IllegalArgumentException e) {
            log.info("Адрес {} не существует: {}", url, e.getMessage());
            return FetchResult.notFound();
        } catch (Exception e) {
            log.info("Не удалось загрузить {}: {}", url, e.getMessage());
            return FetchResult.unavailable();
        }
    }

    Page parse(String url, Document doc) {
        doc.select(NOISE).remove();
        Element root = Optional.ofNullable(doc.selectFirst("article"))
                .or(() -> Optional.ofNullable(doc.selectFirst("main, [role=main]")))
                .orElse(doc.body());

        List<String> headings = new ArrayList<>();
        for (Element h : root.select("h1, h2, h3")) {
            String text = h.text().strip();
            if (!text.isEmpty()) {
                headings.add(h.tagName().toUpperCase() + " " + text);
            }
        }

        StringBuilder text = new StringBuilder();
        String previous = "";
        for (Element block : root.select("h2, h3, p, li, blockquote, td")) {
            // Контейнер с вложенными блоками пропускаем: его текст придет из вложенных
            if (!block.children().select("p, li, blockquote, td").isEmpty()) {
                continue;
            }
            String line = block.text().strip();
            if (line.length() < 3 || line.equals(previous)) {
                continue;
            }
            text.append(line).append('\n');
            previous = line;
            if (text.length() > maxTextChars) {
                break;
            }
        }

        String title = doc.title().isBlank() ? url : doc.title().strip();
        return new Page(url, title, headings, text.toString().strip());
    }

    /** Защита от запросов во внутреннюю сеть по ссылкам пользователя и из выдачи. */
    static boolean isPublicHttpUrl(String url) {
        try {
            URI uri = URI.create(url);
            String scheme = uri.getScheme();
            if (uri.getHost() == null || !("http".equalsIgnoreCase(scheme) || "https".equalsIgnoreCase(scheme))) {
                return false;
            }
            for (InetAddress address : InetAddress.getAllByName(uri.getHost())) {
                if (address.isLoopbackAddress() || address.isSiteLocalAddress() || address.isLinkLocalAddress()
                        || address.isAnyLocalAddress() || address.isMulticastAddress()) {
                    return false;
                }
            }
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
