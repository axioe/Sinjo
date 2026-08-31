package com.slangs.sinjo.dto;

import com.slangs.sinjo.entity.QuizAttempt;

import java.time.LocalDateTime;

/** 마이페이지 "게임 기록" 목록 1행. TranslationDto 와 같은 패턴. */
public record QuizAttemptDto(
        Long id,
        String quizType,
        int score,
        int total,
        LocalDateTime createdAt
) {
    public static QuizAttemptDto from(QuizAttempt attempt) {
        return new QuizAttemptDto(
                attempt.getId(),
                attempt.getQuizType().name(),
                attempt.getScore(),
                attempt.getTotal(),
                attempt.getCreatedAt()
        );
    }
}
