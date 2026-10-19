package ru.seoai.research;

import java.util.List;

import ru.seoai.article.SourceMaterial;

/** Представление материалов источников в тексте промпта. */
public final class MaterialFormatter {

    private MaterialFormatter() {
    }

    /**
     * @param excerptChars сколько символов текста включать, 0 - только заголовки
     */
    public static String format(List<SourceMaterial> materials, int excerptChars) {
        StringBuilder out = new StringBuilder();
        for (SourceMaterial m : materials) {
            out.append("[").append(m.id()).append("] ").append(m.title());
            if (m.url() != null) out.append(" - ").append(m.url());
            out.append('\n');
            if (!m.headings().isEmpty()) {
                out.append("Структура:\n");
                m.headings().stream().limit(40).forEach(h -> out.append("  ").append(h).append('\n'));
            }
            if (excerptChars > 0 && !m.text().isBlank()) {
                out.append("Текст:\n").append(truncate(m.text(), excerptChars)).append('\n');
            }
            out.append('\n');
        }
        return out.toString().strip();
    }

    public static String truncate(String text, int max) {
        if (text.length() <= max) return text;
        int cut = text.lastIndexOf(' ', max);
        return text.substring(0, cut > max / 2 ? cut : max) + " …";
    }
}
