package ru.seoai.api;

import java.nio.charset.StandardCharsets;
import java.util.List;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

import ru.seoai.article.ArticleService;
import ru.seoai.article.ResearchData.ArticleOutline;
import ru.seoai.export.ExportService;
import ru.seoai.generation.GenerationService;
import ru.seoai.research.ResearchService;

@RestController
@RequestMapping("/api/articles")
public class ArticleController {

    private final ArticleService articles;
    private final ResearchService research;
    private final GenerationService generation;
    private final ExportService export;

    public ArticleController(ArticleService articles, ResearchService research, GenerationService generation,
            ExportService export) {
        this.articles = articles;
        this.research = research;
        this.generation = generation;
        this.export = export;
    }

    @GetMapping
    public List<ArticleSummary> list() {
        return articles.list();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.ACCEPTED)
    public IdResponse create(@Valid @RequestBody CreateArticleRequest request) {
        return new IdResponse(articles.create(request));
    }

    @GetMapping("/{id}")
    public ArticleDto get(@PathVariable String id) {
        return articles.get(id);
    }

    @PutMapping("/{id}")
    public ArticleDto update(@PathVariable String id, @Valid @RequestBody ArticlePatch patch) {
        return articles.update(id, patch);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        articles.delete(id);
    }

    @GetMapping("/{id}/research")
    public ResearchResultDto research(@PathVariable String id) {
        return research.get(id);
    }

    @PostMapping("/{id}/research")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public ResearchResultDto restartResearch(@PathVariable String id) {
        return research.restart(id);
    }

    @PutMapping("/{id}/outline")
    public ArticleOutline saveOutline(@PathVariable String id, @Valid @RequestBody OutlineRequest request) {
        return articles.saveOutline(id, request.sections());
    }

    @PostMapping("/{id}/generate")
    public ArticleDto generate(@PathVariable String id, @Valid @RequestBody OutlineRequest request) {
        return generation.generate(id, request.sections());
    }

    @PostMapping("/{id}/regenerate")
    public ArticleDto regenerate(@PathVariable String id) {
        return generation.regenerate(id);
    }

    @PostMapping("/{id}/paragraph-actions")
    public ParagraphActionResponse paragraphAction(@PathVariable String id,
            @Valid @RequestBody ParagraphActionRequest request) {
        return new ParagraphActionResponse(generation.applyParagraphAction(id, request));
    }

    @GetMapping("/{id}/export")
    public ResponseEntity<byte[]> export(@PathVariable String id, @RequestParam(required = false) String format) {
        ExportService.ExportedFile file = export.export(id, ExportService.Format.parse(format));
        return ResponseEntity.ok()
                .contentType(new MediaType(file.mediaType(), StandardCharsets.UTF_8))
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment()
                        .filename(file.filename(), StandardCharsets.UTF_8)
                        .build()
                        .toString())
                .body(file.body().getBytes(StandardCharsets.UTF_8));
    }
}
