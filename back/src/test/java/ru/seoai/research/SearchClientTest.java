package ru.seoai.research;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.List;

import org.junit.jupiter.api.Test;

import ru.seoai.ai.AiClient;
import ru.seoai.ai.AiException;
import ru.seoai.ai.WebSearchResult;
import ru.seoai.ai.WebSearchResult.Source;
import ru.seoai.config.AppProperties;
import ru.seoai.research.ResearchSchemas.SerpHit;
import ru.seoai.research.ResearchSchemas.SerpResults;
import ru.seoai.research.SearchClient.Hit;

class SearchClientTest {

    private final AiClient ai = mock(AiClient.class);
    private final SearchClient client = new SearchClient(ai,
            new AppProperties(null, null, new AppProperties.Research(4, Duration.ofSeconds(5), 6000)));

    private void respond(List<SerpHit> hits, List<Source> sources) {
        SerpResults serp = new SerpResults();
        serp.results = hits;
        when(ai.completeWithWebSearch(anyString(), anyString(), eq(SerpResults.class)))
                .thenReturn(new WebSearchResult<>(serp, sources));
    }

    @Test
    void keepsOnlyUrlsReturnedBySearch() {
        respond(List.of(
                        hit("Настоящая", "https://www.vc.ru/crm/?utm_source=openai"),
                        hit("Выдуманная", "https://habr.com/ru/articles/kak-vybrat-crm-12345"),
                        hit("Кириллица", "https://ru.wikipedia.org/wiki/Система_управления")),
                List.of(new Source("https://vc.ru/crm", null),
                        new Source("https://ru.wikipedia.org/wiki/%D0%A1%D0%B8%D1%81%D1%82%D0%B5%D0%BC%D0%B0_"
                                + "%D1%83%D0%BF%D1%80%D0%B0%D0%B2%D0%BB%D0%B5%D0%BD%D0%B8%D1%8F", null),
                        new Source("https://rb.ru/crm", "CRM для бизнеса")));

        List<Hit> hits = client.search("crm");

        assertThat(hits).extracting(Hit::title).containsExactly("Настоящая", "Кириллица", "CRM для бизнеса");
        assertThat(hits.getFirst().url()).isEqualTo("https://www.vc.ru/crm/");
        assertThat(hits.get(2).url()).isEqualTo("https://rb.ru/crm");
    }

    @Test
    void withoutSourcesKeepsModelResults() {
        respond(List.of(hit("A", "https://a.ru/1"), hit("B", "ftp://b.ru"), hit("", "https://c.ru/2")), List.of());

        List<Hit> hits = client.search("crm");

        assertThat(hits).extracting(Hit::url).containsExactly("https://a.ru/1", "https://c.ru/2");
        assertThat(hits.get(1).title()).isNull();
    }

    @Test
    void respectsLimitAndFailsWhenNothingFound() {
        respond(List.of(), List.of(new Source("https://a.ru/1", "1"), new Source("https://a.ru/2", "2"),
                new Source("https://a.ru/3", "3"), new Source("https://a.ru/4", "4"), new Source("https://a.ru/5", "5")));
        assertThat(client.search("crm")).hasSize(4);

        respond(List.of(hit("Выдуманная", "https://fake.ru/x")), List.of(new Source("not a url", null)));
        // Источников с валидными адресами нет - проверить нечего, остается ответ модели
        assertThat(client.search("crm")).extracting(Hit::url).containsExactly("https://fake.ru/x");

        respond(List.of(), List.of());
        assertThatThrownBy(() -> client.search("crm")).isInstanceOf(AiException.class);
    }

    private static SerpHit hit(String title, String url) {
        SerpHit hit = new SerpHit();
        hit.title = title;
        hit.url = url;
        hit.snippet = "";
        return hit;
    }
}
