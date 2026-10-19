package ru.seoai.ai;

/** Ошибка обращения к LLM: сеть, лимиты, отказ модели или некорректный ответ. */
public class AiException extends RuntimeException {

    public AiException(String message) {
        super(message);
    }

    public AiException(String message, Throwable cause) {
        super(message, cause);
    }
}
