package ru.seoai.api;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import ru.seoai.article.OutlineSection;

public record OutlineRequest(@NotNull @Size(min = 2, max = 60) List<@Valid @NotNull OutlineSection> sections) {
}
