package ru.seoai.research;

import java.net.URI;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import ru.seoai.ai.AiClient;
import ru.seoai.ai.AiException;
import ru.seoai.ai.WebSearchResult;
import ru.seoai.config.AppProperties;
import ru.seoai.research.ResearchSchemas.SerpHit;
import ru.seoai.research.ResearchSchemas.SerpResults;

/**
 * Поисковая выдача через встроенный веб-поиск OpenAI: отдельный поисковый API не нужен.
 * Список адресов модель пишет сама и может ошибиться в URL, поэтому в выдачу попадают
 * только адреса, которые поиск действительно вернул.
 */
@Component
public class SearchClient {

    private static final Logger log = LoggerFactory.getLogger(SearchClient.class);

    /** @param title null, если заголовок неизвестен: его возьмут со страницы */
    public record Hit(String title, String url, String snippet) {
    }

    private final AiClient ai;
    private final int limit;

    public SearchClient(AiClient ai, AppProperties properties) {
        this.ai = ai;
        this.limit = properties.research().serpResults();
    }

    public List<Hit> search(String query) {
        WebSearchResult<SerpResults> result = ai.completeWithWebSearch(Prompts.serp(limit), query, SerpResults.class);
        List<SerpHit> proposed = result.value().results == null ? List.of() : result.value().results;

        // Реальные источники поиска по нормализованному адресу
        Map<String, WebSearchResult.Source> verified = new LinkedHashMap<>();
        for (WebSearchResult.Source source : result.sources()) {
            String url = cleanUrl(source.url());
            if (url != null) {
                verified.merge(key(url), new WebSearchResult.Source(url, source.title()),
                        (a, b) -> a.title() != null ? a : b);
            }
        }

        List<Hit> hits = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        int rejected = 0;
        for (SerpHit h : proposed) {
            String url = cleanUrl(h.url);
            if (url == null || hits.size() == limit || !seen.add(key(url))) continue;
            // Без списка источников проверить нечего: адреса проверит загрузка страниц
            if (!verified.isEmpty() && !verified.containsKey(key(url))) {
                rejected++;
                continue;
            }
            hits.add(new Hit(nonBlank(h.title, null), url, nonBlank(h.snippet, "")));
        }
        // Если модель отбросила или исказила часть адресов, добираем реальными результатами поиска
        for (WebSearchResult.Source source : verified.values()) {
            if (hits.size() == limit) break;
            if (seen.add(key(source.url()))) {
                hits.add(new Hit(nonBlank(source.title(), null), source.url(), ""));
            }
        }
        if (rejected > 0) {
            log.info("Отброшено {} адресов, которых нет в результатах поиска", rejected);
        }
        if (hits.isEmpty()) {
            throw new AiException("Поиск не вернул ни одного результата по теме");
        }
        return hits;
    }

    /** Отбрасывает невалидные адреса и utm-метки, которые веб-поиск добавляет к ссылкам. */
    static String cleanUrl(String url) {
        if (url == null) return null;
        try {
            URI uri = URI.create(url.strip());
            if (uri.getHost() == null || !("http".equals(uri.getScheme()) || "https".equals(uri.getScheme()))) {
                return null;
            }
            String base = url.strip().replaceFirst("[?#].*$", "");
            String query = uri.getRawQuery() == null ? "" : Stream.of(uri.getRawQuery().split("&"))
                    .filter(p -> !p.startsWith("utm_"))
                    .collect(Collectors.joining("&"));
            return query.isEmpty() ? base : base + "?" + query;
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Ключ сравнения адресов: без схемы, www, завершающего слэша и регистра домена.
     * Путь декодируется: модель может написать кириллицу как есть, а поиск - в %-кодировке.
     */
    static String key(String url) {
        URI uri = URI.create(url);
        String host = uri.getHost().toLowerCase(Locale.ROOT).replaceFirst("^www\\.", "");
        String path = uri.getPath() == null ? "" : uri.getPath().replaceFirst("/+$", "");
        return host + path + (uri.getQuery() == null ? "" : "?" + uri.getQuery());
    }

    private static String nonBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.strip();
    }
}
