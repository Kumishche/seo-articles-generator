package ru.seoai.ai;

import static org.assertj.core.api.Assertions.assertThatCode;

import java.util.stream.Stream;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

import com.openai.models.responses.ResponseCreateParams;

import ru.seoai.generation.GenerationSchemas;
import ru.seoai.research.ResearchSchemas;

/**
 * SDK проверяет JSON Schema локально при сборке запроса. Если класс ответа нельзя
 * описать схемой для structured outputs, тест упадет до обращения к OpenAI.
 */
class SchemaTest {

    static Stream<Class<?>> schemas() {
        return Stream.of(
                ResearchSchemas.SerpResults.class,
                ResearchSchemas.IntentAnalysis.class,
                ResearchSchemas.KeywordSelection.class,
                ResearchSchemas.OutlineDraft.class,
                GenerationSchemas.DraftArticle.class,
                GenerationSchemas.EditedArticle.class,
                GenerationSchemas.ParagraphText.class);
    }

    @ParameterizedTest
    @MethodSource("schemas")
    void schemaIsValidForStructuredOutputs(Class<?> type) {
        assertThatCode(() -> ResponseCreateParams.builder()
                .model("gpt-5-mini")
                .input("test")
                .text(type)
                .build())
                .doesNotThrowAnyException();
    }
}
