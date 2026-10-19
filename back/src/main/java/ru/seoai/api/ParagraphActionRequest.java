package ru.seoai.api;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ParagraphActionRequest(@NotNull Action action, @NotBlank @Size(max = 5000) String text) {

    public enum Action {
        @JsonProperty("rewrite") REWRITE,
        @JsonProperty("shorten") SHORTEN,
        @JsonProperty("expand") EXPAND,
        @JsonProperty("improve") IMPROVE
    }
}
