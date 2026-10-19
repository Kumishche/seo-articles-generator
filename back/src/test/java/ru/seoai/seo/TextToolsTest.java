package ru.seoai.seo;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class TextToolsTest {

    @Test
    void slugTransliteratesRussian() {
        assertThat(Slugifier.slugify("CRM для малого бизнеса")).isEqualTo("crm-dlya-malogo-biznesa");
        assertThat(Slugifier.slugify("Щука, ёж и «чай»!")).isEqualTo("shchuka-ezh-i-chay");
        assertThat(Slugifier.slugify("???")).isEqualTo("article");
    }

    @Test
    void slugIsLimitedAtWordBoundary() {
        String slug = Slugifier.slugify("очень ".repeat(30) + "длинный заголовок");
        assertThat(slug.length()).isLessThanOrEqualTo(80);
        assertThat(slug).doesNotEndWith("-").startsWith("ochen-ochen");
    }

    @Test
    void countsWords() {
        assertThat(TextStats.countWords("Как выбрать CRM-систему: 5 шагов.")).isEqualTo(5);
    }

    @Test
    void keywordMatchesInflectedForms() {
        String text = "CRM для малого бизнеса нужна. Выбор CRM для малому бизнесу непрост. CRM для крупного бизнеса.";
        assertThat(TextStats.countOccurrences(text, "CRM для малого бизнеса")).isEqualTo(2);
        assertThat(TextStats.countOccurrences("Лучшая CRM и лучшей CRM", "лучшая CRM")).isEqualTo(2);
        assertThat(TextStats.countOccurrences("Стоимость внедрения", "внедрение CRM")).isZero();
    }
}
