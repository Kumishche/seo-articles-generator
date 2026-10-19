package ru.seoai.source;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Repository;

import ru.seoai.article.ArticleSource;

/** Загруженные файлы: метаданные и извлеченный текст. Сам файл не хранится. Позже заменяется на MinIO. */
@Repository
public class FileRepository {

    public record StoredFile(ArticleSource source, String text) {
    }

    private final Map<String, StoredFile> files = new ConcurrentHashMap<>();

    public void save(StoredFile file) {
        files.put(file.source().id(), file);
    }

    public Optional<StoredFile> find(String id) {
        return Optional.ofNullable(files.get(id));
    }

    public boolean delete(String id) {
        return files.remove(id) != null;
    }
}
