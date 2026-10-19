package ru.seoai.article;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

public record SeoAnalysis(int score, int maxScore, String verdict, String summary, List<SeoCheck> checks,
        List<KeywordStat> keywords) {

    public record SeoCheck(String id, String label, Status status, String hint) {

        public enum Status {
            @JsonProperty("passed") PASSED,
            @JsonProperty("warning") WARNING,
            @JsonProperty("failed") FAILED
        }
    }

    /** @param target рекомендуемое число упоминаний запроса */
    public record KeywordStat(String phrase, int target) {
    }
}
