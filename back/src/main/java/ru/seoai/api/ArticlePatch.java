package ru.seoai.api;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Частичное обновление статьи: null означает «не менять». */
public record ArticlePatch(
        @Size(max = 300) String title,
        @Size(max = 500_000) String content,
        @Size(max = 300) String seoTitle,
        @Size(max = 500) String metaDescription,
        @Pattern(regexp = "^[a-z0-9]+(-[a-z0-9]+)*$", message = "только латиница в нижнем регистре, цифры и дефисы")
        @Size(max = 120) String slug) {
}
