package com.slangs.sinjo.dto;

import java.util.List;

public record QuizQuestion(
        String word,
        String question,
        List<String> options,
        int answer,
        String explanation
) {
}