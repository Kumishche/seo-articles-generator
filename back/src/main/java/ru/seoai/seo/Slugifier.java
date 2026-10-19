package ru.seoai.seo;

import java.util.Locale;
import java.util.Map;

/** Транслитерация заголовка в URL: «Как выбрать CRM» -> kak-vybrat-crm. */
public final class Slugifier {

    private static final int MAX_LENGTH = 80;

    private static final Map<Character, String> RU = Map.ofEntries(
            Map.entry('а', "a"), Map.entry('б', "b"), Map.entry('в', "v"), Map.entry('г', "g"),
            Map.entry('д', "d"), Map.entry('е', "e"), Map.entry('ё', "e"), Map.entry('ж', "zh"),
            Map.entry('з', "z"), Map.entry('и', "i"), Map.entry('й', "y"), Map.entry('к', "k"),
            Map.entry('л', "l"), Map.entry('м', "m"), Map.entry('н', "n"), Map.entry('о', "o"),
            Map.entry('п', "p"), Map.entry('р', "r"), Map.entry('с', "s"), Map.entry('т', "t"),
            Map.entry('у', "u"), Map.entry('ф', "f"), Map.entry('х', "kh"), Map.entry('ц', "ts"),
            Map.entry('ч', "ch"), Map.entry('ш', "sh"), Map.entry('щ', "shch"), Map.entry('ъ', ""),
            Map.entry('ы', "y"), Map.entry('ь', ""), Map.entry('э', "e"), Map.entry('ю', "yu"),
            Map.entry('я', "ya"));

    private Slugifier() {
    }

    public static String slugify(String text) {
        StringBuilder out = new StringBuilder();
        for (char c : text.toLowerCase(Locale.ROOT).toCharArray()) {
            String mapped = RU.get(c);
            if (mapped != null) {
                out.append(mapped);
            } else if ((c >= 'a' && c <= 'z') || (c >= '0' && c <= '9')) {
                out.append(c);
            } else {
                out.append('-');
            }
        }
        String slug = out.toString().replaceAll("-{2,}", "-").replaceAll("^-|-$", "");
        if (slug.length() > MAX_LENGTH) {
            int cut = slug.lastIndexOf('-', MAX_LENGTH);
            slug = slug.substring(0, cut > 20 ? cut : MAX_LENGTH).replaceAll("-$", "");
        }
        return slug.isEmpty() ? "article" : slug;
    }
}
