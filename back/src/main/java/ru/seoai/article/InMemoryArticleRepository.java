package ru.seoai.article;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;

import org.springframework.stereotype.Repository;

@Repository
public class InMemoryArticleRepository implements ArticleRepository {

    private final Map<String, Article> articles = new ConcurrentHashMap<>();

    @Override
    public void save(Article article) {
        articles.put(article.id(), article);
    }

    @Override
    public <R> Optional<R> read(String id, Function<Article, R> reader) {
        Article article = articles.get(id);
        if (article == null) {
            return Optional.empty();
        }
        synchronized (article) {
            return Optional.ofNullable(reader.apply(article));
        }
    }

    @Override
    public <R> Optional<R> update(String id, Function<Article, R> mutator) {
        Article article = articles.get(id);
        if (article == null) {
            return Optional.empty();
        }
        synchronized (article) {
            R result = mutator.apply(article);
            article.touch();
            return Optional.ofNullable(result);
        }
    }

    @Override
    public <R> List<R> readAll(Function<Article, R> reader) {
        return articles.values().stream()
                .map(article -> {
                    synchronized (article) {
                        return reader.apply(article);
                    }
                })
                .toList();
    }

    @Override
    public boolean delete(String id) {
        return articles.remove(id) != null;
    }
}
