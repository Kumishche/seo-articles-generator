package ru.seoai.source;

import java.io.IOException;
import java.time.Instant;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import ru.seoai.article.ArticleSource;
import ru.seoai.common.ApiException;
import ru.seoai.source.FileRepository.StoredFile;

@Service
public class FileService {

    public static final long MAX_SIZE = 20L * 1024 * 1024;
    /** Больше этого объема текста из одного файла в промпты все равно не попадет */
    private static final int MAX_TEXT_CHARS = 200_000;

    private static final Logger log = LoggerFactory.getLogger(FileService.class);

    private final TextExtractor extractor;
    private final FileRepository repository;

    public FileService(TextExtractor extractor, FileRepository repository) {
        this.extractor = extractor;
        this.repository = repository;
    }

    public ArticleSource upload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("Файл не передан или пустой");
        }
        if (file.getSize() > MAX_SIZE) {
            throw new ApiException(HttpStatus.CONTENT_TOO_LARGE, "Файл больше 20 МБ");
        }
        String name = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
        FileFormat format = FileFormat.fromFilename(name)
                .orElseThrow(() -> new ApiException(HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                        "Поддерживаются только PDF, DOCX и TXT"));

        String text;
        try {
            text = extractor.extract(format, file.getBytes());
        } catch (IOException | RuntimeException e) {
            log.info("Не удалось прочитать файл {}: {}", name, e.getMessage());
            throw ApiException.badRequest("Не удалось прочитать файл: он поврежден или защищен паролем");
        }
        if (text.isBlank()) {
            throw ApiException.badRequest("В файле не найден текст. Если это скан, распознайте его перед загрузкой");
        }
        if (text.length() > MAX_TEXT_CHARS) {
            text = text.substring(0, MAX_TEXT_CHARS);
        }

        ArticleSource source = new ArticleSource("file-" + UUID.randomUUID(), ArticleSource.Type.FILE, name, null,
                null, file.getSize(), file.getContentType(), Instant.now());
        repository.save(new StoredFile(source, text));
        return source;
    }

    public void delete(String id) {
        if (!repository.delete(id)) {
            throw ApiException.notFound("Файл не найден");
        }
    }
}
