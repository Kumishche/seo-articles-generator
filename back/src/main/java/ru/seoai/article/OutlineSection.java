package ru.seoai.article;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Заголовок структуры статьи: level 1 - H1, 2 - H2, 3 - H3. */
public record OutlineSection(
        @NotBlank @Size(max = 100) String id,
        @NotNull @Min(1) @Max(3) Integer level,
        @NotNull @Size(max = 300) String title) {
}
