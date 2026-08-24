package com.slangs.sinjo.dto;

import java.util.List;

public record QuizResponse(
        List<QuizQuestion> questions
) {
}
