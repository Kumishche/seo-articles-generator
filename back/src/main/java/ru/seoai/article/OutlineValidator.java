package ru.seoai.article;

import java.util.List;

import ru.seoai.common.ApiException;

/** Проверка структуры: те же правила, что в OutlineEditor фронтенда. */
public final class OutlineValidator {

    private OutlineValidator() {
    }

    /** Возвращает структуру с обрезанными пробелами в заголовках или бросает 400. */
    public static List<OutlineSection> validate(List<OutlineSection> sections) {
        List<OutlineSection> trimmed = sections.stream()
                .map(s -> new OutlineSection(s.id(), s.level(), s.title().strip()))
                .toList();

        if (trimmed.isEmpty() || trimmed.getFirst().level() != 1) {
            throw ApiException.badRequest("Первый элемент структуры должен быть заголовком H1");
        }
        if (trimmed.stream().skip(1).anyMatch(s -> s.level() == 1)) {
            throw ApiException.badRequest("В структуре может быть только один H1");
        }
        if (trimmed.stream().noneMatch(s -> s.level() == 2)) {
            throw ApiException.badRequest("Добавьте хотя бы один раздел H2");
        }
        if (trimmed.size() > 1 && trimmed.get(1).level() == 3) {
            throw ApiException.badRequest("Подраздел H3 не может идти сразу после H1");
        }
        long empty = trimmed.stream().filter(s -> s.title().isEmpty()).count();
        if (empty > 0) {
            throw ApiException.badRequest("Заполните пустые заголовки: " + empty);
        }
        long distinctIds = trimmed.stream().map(OutlineSection::id).distinct().count();
        if (distinctIds != trimmed.size()) {
            throw ApiException.badRequest("Идентификаторы разделов должны быть уникальными");
        }
        return trimmed;
    }
}
