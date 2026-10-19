package ru.seoai.config;

import java.time.Duration;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Настройки приложения из секции {@code app} в application.yml. */
@ConfigurationProperties(prefix = "app")
public record AppProperties(OpenAi openai, Cors cors, Research research) {

    public record OpenAi(String apiKey, String baseUrl, String model, String searchModel, Duration timeout) {
    }

    public record Cors(List<String> origins) {
    }

    /**
     * @param serpResults     сколько результатов выдачи запрашивать у поиска
     * @param fetchTimeout    таймаут загрузки одной страницы
     * @param pageExcerptChars сколько символов текста страницы передавать в LLM
     */
    public record Research(int serpResults, Duration fetchTimeout, int pageExcerptChars) {
    }
}
