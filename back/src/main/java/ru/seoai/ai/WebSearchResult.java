package ru.seoai.ai;

import java.util.List;

/**
 * Ответ модели после веб-поиска.
 *
 * @param value   структурированный ответ
 * @param sources страницы, которые поиск действительно вернул: источники вызова web_search
 *                и цитаты из ответа. Адреса в {@code value} пишет сама модель, поэтому
 *                проверять их нужно по этому списку
 */
public record WebSearchResult<T>(T value, List<Source> sources) {

    /** @param title заголовок страницы, если поиск его сообщил */
    public record Source(String url, String title) {
    }
}
