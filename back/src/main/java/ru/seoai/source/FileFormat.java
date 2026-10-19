package ru.seoai.source;

import java.util.Locale;
import java.util.Optional;

public enum FileFormat {
    PDF, DOCX, TXT;

    public static Optional<FileFormat> fromFilename(String filename) {
        if (filename == null) {
            return Optional.empty();
        }
        int dot = filename.lastIndexOf('.');
        String ext = dot < 0 ? "" : filename.substring(dot + 1).toLowerCase(Locale.ROOT);
        return switch (ext) {
            case "pdf" -> Optional.of(PDF);
            case "docx" -> Optional.of(DOCX);
            case "txt" -> Optional.of(TXT);
            default -> Optional.empty();
        };
    }
}
