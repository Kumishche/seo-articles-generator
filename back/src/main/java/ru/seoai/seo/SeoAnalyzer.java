package ru.seoai.seo;

import java.util.ArrayList;
import java.util.List;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Component;

import ru.seoai.article.Article;
import ru.seoai.article.ResearchData.Keyword;
import ru.seoai.article.ResearchData.WordRange;
import ru.seoai.article.SeoAnalysis;
import ru.seoai.article.SeoAnalysis.KeywordStat;
import ru.seoai.article.SeoAnalysis.SeoCheck;
import ru.seoai.article.SeoAnalysis.SeoCheck.Status;

/**
 * Детерминированная SEO-оценка статьи. Id проверок совпадают с теми,
 * на которые завязан фронтенд (kw-title, meta, links и т. д.).
 */
@Component
public class SeoAnalyzer {

    static final int MAX_SCORE = 100;
    private static final int META_MIN = 140;
    private static final int META_MAX = 160;
    private static final double DENSITY_MIN = 0.3;
    private static final double DENSITY_MAX = 3.0;
    private static final int MAX_KEYWORD_STATS = 8;

    private record Weighted(SeoCheck check, int weight) {
    }

    public SeoAnalysis analyze(Article article) {
        List<Keyword> keywords = article.research().keywords() == null ? List.of() : article.research().keywords();
        WordRange range = article.research().outline() == null ? null : article.research().outline().estimatedWords();

        Document doc = Jsoup.parseBodyFragment(article.content());
        String text = doc.body().text();
        List<String> words = TextStats.words(text);
        String primary = keywords.stream().filter(Keyword::primary).map(Keyword::phrase).findFirst()
                .orElse(article.topic());

        List<Weighted> checks = List.of(
                new Weighted(intent(article.intentCovered()), 20),
                new Weighted(keywordInTitle(article.title(), primary), 15),
                new Weighted(keywordInIntro(doc, primary), 10),
                new Weighted(density(words, keywords, primary), 15),
                new Weighted(length(words.size(), range), 15),
                new Weighted(headings(doc), 10),
                new Weighted(meta(article.metaDescription()), 10),
                new Weighted(links(doc), 5));

        double score = 0;
        for (Weighted w : checks) {
            score += switch (w.check().status()) {
                case PASSED -> w.weight();
                case WARNING -> w.weight() / 2.0;
                case FAILED -> 0;
            };
        }
        int rounded = (int) Math.round(score);
        List<SeoCheck> list = checks.stream().map(Weighted::check).toList();
        return new SeoAnalysis(rounded, MAX_SCORE, verdict(rounded), summary(list), list,
                keywordStats(keywords, words.size()));
    }

    static String verdict(int score) {
        if (score >= 95) return "Отлично";
        if (score >= 75) return "Хорошо";
        if (score >= 50) return "Удовлетворительно";
        return "Требует доработки";
    }

    private static String summary(List<SeoCheck> checks) {
        long failed = checks.stream().filter(c -> c.status() == Status.FAILED).count();
        long warnings = checks.stream().filter(c -> c.status() == Status.WARNING).count();
        if (failed > 0) {
            return "Есть критичные замечания (" + failed + "). Исправьте их перед публикацией.";
        }
        if (warnings > 0) {
            return "Статья соответствует основному поисковому интенту. Осталось учесть рекомендации ниже.";
        }
        return "Статья соответствует поисковому интенту и покрывает ключевые запросы.";
    }

    private static SeoCheck intent(boolean covered) {
        return covered
                ? passed("intent", "Поисковый интент раскрыт")
                : warning("intent", "Поисковый интент раскрыт не полностью",
                        "Сверьтесь с рекомендациями анализа и дополните недостающие разделы.");
    }

    private static SeoCheck keywordInTitle(String title, String primary) {
        return TextStats.countOccurrences(title, primary) > 0
                ? passed("kw-title", "Основной ключ есть в заголовке")
                : warning("kw-title", "Основного ключа нет в заголовке", "Добавьте «" + primary + "» в H1.");
    }

    /** Введение: абзацы до первого H2. */
    private static SeoCheck keywordInIntro(Document doc, String primary) {
        StringBuilder intro = new StringBuilder();
        for (Element el : doc.body().children()) {
            if (el.tagName().equals("h2")) break;
            intro.append(el.text()).append(' ');
        }
        return TextStats.countOccurrences(intro.toString(), primary) > 0
                ? passed("kw-intro", "Основной ключ есть во введении")
                : warning("kw-intro", "Основного ключа нет во введении",
                        "Упомяните «" + primary + "» в первом-втором абзаце.");
    }

    /** Доля слов основных ключевых фраз от объема текста, в процентах. */
    private static SeoCheck density(List<String> words, List<Keyword> keywords, String primary) {
        if (words.isEmpty()) {
            return failed("density", "Текст статьи пустой", null);
        }
        List<String> phrases = keywords.stream().filter(Keyword::primary).map(Keyword::phrase).toList();
        if (phrases.isEmpty()) phrases = List.of(primary);
        int keywordWords = 0;
        for (String phrase : phrases) {
            keywordWords += TextStats.countOccurrences(words, phrase) * TextStats.countWords(phrase);
        }
        double density = keywordWords * 100.0 / words.size();
        if (density > DENSITY_MAX) {
            return failed("density", "Ключевые слова повторяются слишком часто",
                    String.format("Плотность %.1f%%. Замените часть повторов синонимами.", density));
        }
        if (density < DENSITY_MIN) {
            return warning("density", "Ключевых слов в тексте мало",
                    "Естественно используйте основные запросы в разделах статьи.");
        }
        return passed("density", "Плотность ключевых слов в норме");
    }

    private static SeoCheck length(int words, WordRange range) {
        int min = range == null ? 1000 : range.min();
        if (words >= min * 0.85) {
            return passed("length", "Объем статьи достаточный");
        }
        String hint = "Сейчас " + words + " слов, по результатам анализа нужно от " + min + ".";
        return words >= min * 0.5
                ? warning("length", "Статья короче, чем у конкурентов", hint)
                : failed("length", "Объем статьи недостаточный", hint);
    }

    private static SeoCheck headings(Document doc) {
        List<Element> hs = doc.body().select("h2, h3");
        boolean hasEmpty = hs.stream().anyMatch(h -> h.text().isBlank());
        boolean h3First = !hs.isEmpty() && hs.getFirst().tagName().equals("h3");
        long h2 = hs.stream().filter(h -> h.tagName().equals("h2")).count();
        if (h2 >= 2 && !hasEmpty && !h3First) {
            return passed("headings", "Структура заголовков корректна");
        }
        return warning("headings", "Структуру заголовков стоит поправить",
                h2 < 2 ? "Добавьте хотя бы два раздела H2." : "Уберите пустые заголовки и H3 перед первым H2.");
    }

    private static SeoCheck meta(String meta) {
        int len = meta == null ? 0 : meta.strip().length();
        if (len >= META_MIN && len <= META_MAX) {
            return passed("meta", "Meta description оптимальной длины");
        }
        if (len == 0) {
            return failed("meta", "Meta description не заполнен", "Добавьте описание на 140-160 символов.");
        }
        return warning("meta", "Meta description можно улучшить",
                "Сейчас " + len + " символов. Добавьте призыв к действию и уложитесь в 140-160 символов.");
    }

    /** Внутренние ссылки - относительные адреса: домен сайта в этой версии не известен. */
    private static SeoCheck links(Document doc) {
        boolean internal = doc.body().select("a[href]").stream()
                .map(a -> a.attr("href"))
                .anyMatch(href -> href.startsWith("/") && !href.startsWith("//"));
        return internal
                ? passed("links", "Внутренние ссылки добавлены")
                : warning("links", "Не добавлены внутренние ссылки",
                        "Добавьте 2-3 ссылки на связанные материалы вашего сайта.");
    }

    /** Рекомендуемое число упоминаний: примерно раз на 300 слов для основных ключей и на 700 для дополнительных. */
    static List<KeywordStat> keywordStats(List<Keyword> keywords, int words) {
        List<KeywordStat> stats = new ArrayList<>();
        for (Keyword k : keywords) {
            if (stats.size() == MAX_KEYWORD_STATS) break;
            int target = k.primary() ? Math.max(2, Math.round(words / 300f)) : Math.max(1, Math.round(words / 700f));
            stats.add(new KeywordStat(k.phrase(), target));
        }
        return stats;
    }

    private static SeoCheck passed(String id, String label) {
        return new SeoCheck(id, label, Status.PASSED, null);
    }

    private static SeoCheck warning(String id, String label, String hint) {
        return new SeoCheck(id, label, Status.WARNING, hint);
    }

    private static SeoCheck failed(String id, String label, String hint) {
        return new SeoCheck(id, label, Status.FAILED, hint);
    }
}
