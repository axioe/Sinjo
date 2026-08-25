package com.slangs.sinjo.dto;

public record TranslationSaveRequest(
        String originalText,
        String translatedText,
        String explanation
) {}