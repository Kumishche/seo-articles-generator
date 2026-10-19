package ru.seoai.article;

import java.util.List;
import java.util.Optional;
import java.util.function.Consumer;
import java.util.function.Function;

/**
 * Хранилище статей. Сейчас в памяти; интерфейс оставлен, чтобы позже
 * подключить PostgreSQL без изменения сервисов.
 */
public interface ArticleRepository {

    void save(Article article);

    /** Читает статью под блокировкой и возвращает результат функции, например DTO. */
    <R> Optional<R> read(String id, Function<Article, R> reader);

    /** Изменяет статью под блокировкой и возвращает результат функции. */
    <R> Optional<R> update(String id, Function<Article, R> mutator);

    /** Изменяет статью под блокировкой. false, если статьи нет. */
    default boolean modify(String id, Consumer<Article> mutator) {
        return update(id, article -> {
            mutator.accept(article);
            return Boolean.TRUE;
        }).isPresent();
    }

    <R> List<R> readAll(Function<Article, R> reader);

    boolean delete(String id);
}
