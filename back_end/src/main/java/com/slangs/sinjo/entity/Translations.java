package com.slangs.sinjo.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "translations")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Translations extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TranslationMode mode;

    @Column(name = "original_text", nullable = false, columnDefinition = "TEXT")
    private String originalText;

    @Column(name = "translated_text", nullable = false, columnDefinition = "TEXT")
    private String translatedText;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Builder
    private Translations(Long userId, TranslationMode mode, String originalText,
                         String translatedText, String explanation) {
        this.userId = userId;
        this.mode = mode;
        this.originalText = originalText;
        this.translatedText = translatedText;
        this.explanation = explanation;
    }
}
