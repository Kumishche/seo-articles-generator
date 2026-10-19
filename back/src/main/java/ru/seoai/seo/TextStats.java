package ru.seoai.seo;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Подсчет слов и вхождений ключевых фраз с учетом русских окончаний. */
public final class TextStats {

    private static final Pattern WORD = Pattern.compile("[\\p{L}\\p{N}]+(?:-[\\p{L}\\p{N}]+)*");

    private TextStats() {
    }

    public static List<String> words(String text) {
        List<String> words = new ArrayList<>();
        Matcher m = WORD.matcher(text.toLowerCase(Locale.ROOT).replace('ё', 'е'));
        while (m.find()) {
            words.add(m.group());
        }
        return words;
    }

    public static int countWords(String text) {
        return words(text).size();
    }

    /**
     * Число вхождений фразы. Слово фразы совпадает со словом текста, если у них общая основа:
     * «малого бизнеса» найдется в «малому бизнесу», «CRM» - только как «crm».
     */
    public static int countOccurrences(String text, String phrase) {
        return countOccurrences(words(text), phrase);
    }

    public static int countOccurrences(List<String> textWords, String phrase) {
        List<String> stems = words(phrase).stream().map(TextStats::stem).toList();
        if (stems.isEmpty()) {
            return 0;
        }
        int count = 0;
        for (int i = 0; i + stems.size() <= textWords.size(); i++) {
            boolean match = true;
            for (int j = 0; j < stems.size() && match; j++) {
                match = textWords.get(i + j).startsWith(stems.get(j));
            }
            if (match) {
                count++;
                i += stems.size() - 1;
            }
        }
        return count;
    }

    /** Окончания существительных и прилагательных, от длинных к коротким. */
    private static final List<String> ENDINGS = List.of(
            "ого", "его", "ому", "ему", "ыми", "ими", "ами", "ями",
            "ой", "ей", "ий", "ый", "ая", "яя", "ое", "ее", "ые", "ие", "ую", "юю",
            "ом", "ем", "ам", "ям", "ах", "ях", "ов", "ев",
            "а", "я", "о", "е", "у", "ю", "ы", "и", "ь", "й");

    private static final int MIN_STEM = 3;

    /** Грубая основа: отбрасываем падежное окончание, если остается хотя бы 3 буквы. */
    static String stem(String word) {
        if (word.length() <= 4) {
            return word;
        }
        for (String ending : ENDINGS) {
            if (word.endsWith(ending) && word.length() - ending.length() >= MIN_STEM) {
                return word.substring(0, word.length() - ending.length());
            }
        }
        return word;
    }
}
