package com.slangs.sinjo.dto;

import com.slangs.sinjo.entity.Translations;
import java.time.LocalDateTime;

public record TranslationDto(
        Long id,
        String mode,
        String originalText,
        String translatedText,
        String explanation,
        LocalDateTime createdAt
) {
    public static TranslationDto from(Translations t) {
        return new TranslationDto(
                t.getId(),
                t.getMode().name(),
                t.getOriginalText(),
                t.getTranslatedText(),
                t.getExplanation(),
                t.getCreatedAt()
        );
    }
}