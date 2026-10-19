package ru.seoai.source;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.Charset;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Component;

/** Извлекает plain text из PDF, DOCX и TXT. */
@Component
public class TextExtractor {

    private static final Charset WINDOWS_1251 = Charset.forName("windows-1251");

    public String extract(FileFormat format, byte[] bytes) throws IOException {
        String raw = switch (format) {
            case PDF -> pdf(bytes);
            case DOCX -> docx(bytes);
            case TXT -> txt(bytes);
        };
        return normalize(raw);
    }

    private String pdf(byte[] bytes) throws IOException {
        try (PDDocument document = Loader.loadPDF(bytes)) {
            return new PDFTextStripper().getText(document);
        }
    }

    private String docx(byte[] bytes) throws IOException {
        try (XWPFDocument document = new XWPFDocument(new ByteArrayInputStream(bytes));
                XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
            return extractor.getText();
        }
    }

    /** TXT в UTF-8, а если байты не декодируются - в Windows-1251 (частый случай для русских файлов). */
    private String txt(byte[] bytes) {
        try {
            return StandardCharsets.UTF_8.newDecoder()
                    .onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT)
                    .decode(ByteBuffer.wrap(bytes))
                    .toString()
                    .replace("﻿", "");
        } catch (CharacterCodingException e) {
            return new String(bytes, WINDOWS_1251);
        }
    }

    static String normalize(String text) {
        return text.replace("\r", "")
                .replaceAll("[\\t\\x0B\\f\\u00A0]+", " ")
                .replaceAll(" *\\n *", "\n")
                .replaceAll("\\n{3,}", "\n\n")
                .strip();
    }
}
