package ru.seoai.article;

import java.util.List;

/**
 * Текст источника, на который опирается генерация: страница конкурента
 * или материал пользователя (ссылка, файл).
 *
 * @param id       короткий идентификатор для ссылок в промпте (C1, U1, ...)
 * @param sourceId id исходного объекта: конкурента или ArticleSource
 */
public record SourceMaterial(String id, String sourceId, Origin origin, String title, String url,
        List<String> headings, String text) {

    public enum Origin {
        COMPETITOR, USER
    }
}
