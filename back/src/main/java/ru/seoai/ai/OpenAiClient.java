package ru.seoai.ai;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.openai.client.OpenAIClient;
import com.openai.client.okhttp.OpenAIOkHttpClient;
import com.openai.errors.OpenAIException;
import com.openai.models.responses.ResponseCreateParams;
import com.openai.models.responses.ResponseIncludable;
import com.openai.models.responses.StructuredResponse;
import com.openai.models.responses.StructuredResponseCreateParams;
import com.openai.models.responses.StructuredResponseOutputItem;
import com.openai.models.responses.StructuredResponseOutputMessage;
import com.openai.models.responses.WebSearchTool;

import ru.seoai.config.AppProperties;

/** Реализация на OpenAI Responses API со structured outputs. */
@Component
public class OpenAiClient implements AiClient {

    private static final Logger log = LoggerFactory.getLogger(OpenAiClient.class);

    private final AppProperties.OpenAi settings;
    private volatile OpenAIClient client;

    public OpenAiClient(AppProperties properties) {
        this.settings = properties.openai();
    }

    @Override
    public <T> T complete(String instructions, String input, Class<T> responseType) {
        return value(call(settings.model(), instructions, input, responseType, false));
    }

    @Override
    public <T> WebSearchResult<T> completeWithWebSearch(String instructions, String input, Class<T> responseType) {
        StructuredResponse<T> response = call(settings.searchModel(), instructions, input, responseType, true);
        return new WebSearchResult<>(value(response), sources(response));
    }

    private <T> StructuredResponse<T> call(String model, String instructions, String input, Class<T> type,
            boolean webSearch) {
        ResponseCreateParams.Builder builder = ResponseCreateParams.builder()
                .model(model)
                .instructions(instructions)
                .input(input);
        if (webSearch) {
            builder.addTool(WebSearchTool.builder()
                    .type(WebSearchTool.Type.WEB_SEARCH)
                    .userLocation(WebSearchTool.UserLocation.builder()
                            .type(WebSearchTool.UserLocation.Type.APPROXIMATE)
                            .country("RU")
                            .build())
                    .build());
            // Без этого ответ не содержит список страниц, которые реально нашел поиск
            builder.include(List.of(ResponseIncludable.WEB_SEARCH_CALL_ACTION_SOURCES));
        }
        StructuredResponseCreateParams<T> params = builder.text(type).build();

        long started = System.currentTimeMillis();
        StructuredResponse<T> response;
        try {
            response = client().responses().create(params);
        } catch (OpenAIException e) {
            throw new AiException("Не удалось получить ответ от OpenAI: " + e.getMessage(), e);
        }
        log.debug("OpenAI {} -> {} за {} мс", model, type.getSimpleName(), System.currentTimeMillis() - started);
        return response;
    }

    private static <T> T value(StructuredResponse<T> response) {
        return response.output().stream()
                .map(StructuredResponseOutputItem::message)
                .flatMap(Optional::stream)
                .map(StructuredResponseOutputMessage::content)
                .flatMap(content -> content.stream())
                .map(StructuredResponseOutputMessage.Content::outputText)
                .flatMap(Optional::stream)
                .reduce((first, last) -> last)
                .orElseThrow(() -> new AiException("Модель не вернула ответ (возможен отказ или обрыв генерации)"));
    }

    /** Источники вызовов web_search и цитаты url_citation из текста ответа. */
    private static <T> List<WebSearchResult.Source> sources(StructuredResponse<T> response) {
        List<WebSearchResult.Source> sources = new ArrayList<>();
        for (StructuredResponseOutputItem<T> item : response.output()) {
            item.webSearchCall().ifPresent(call -> {
                try {
                    call.action().search()
                            .flatMap(search -> search.sources())
                            .ifPresent(list -> list.forEach(s -> sources.add(new WebSearchResult.Source(s.url(), null))));
                } catch (OpenAIException e) {
                    // у вызова нет action - например, поиск открыл страницу, а не искал
                }
            });
            item.message().ifPresent(message -> message.content().forEach(content -> content.rawContent()
                    .outputText()
                    .ifPresent(text -> text.annotations().forEach(a -> a.urlCitation()
                            .ifPresent(c -> sources.add(new WebSearchResult.Source(c.url(), c.title())))))));
        }
        return sources;
    }

    private OpenAIClient client() {
        if (client == null) {
            synchronized (this) {
                if (client == null) {
                    if (settings.apiKey() == null || settings.apiKey().isBlank()) {
                        throw new AiException("Не задан OPENAI_API_KEY");
                    }
                    client = OpenAIOkHttpClient.builder()
                            .apiKey(settings.apiKey())
                            .baseUrl(Optional.ofNullable(settings.baseUrl()).filter(url -> !url.isBlank()))
                            .timeout(settings.timeout())
                            .maxRetries(2)
                            .build();
                }
            }
        }
        return client;
    }
}
