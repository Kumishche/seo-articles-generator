package ru.seoai.ai;

/**
 * Вызовы LLM со структурированным ответом. Тип ответа описывается классом
 * с публичными полями: по нему строится JSON Schema, и модель обязана ей следовать.
 */
public interface AiClient {

    <T> T complete(String instructions, String input, Class<T> responseType);

    /** То же, но модель ищет в интернете перед ответом. Вместе с ответом возвращаются реальные источники поиска. */
    <T> WebSearchResult<T> completeWithWebSearch(String instructions, String input, Class<T> responseType);
}
