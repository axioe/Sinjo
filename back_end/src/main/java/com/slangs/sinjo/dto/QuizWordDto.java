package com.slangs.sinjo.dto;

import com.slangs.sinjo.entity.QuizWord;
import lombok.Getter;

import java.util.List;

/**
 * 관리자 퀴즈 관리 화면용 DTO.
 * QuizDto(플레이어에게 내려주는 문제)와 달리 정답(answer)도 그대로 내려준다 -
 * /api/admin/** 는 ADMIN 권한만 통과하므로 노출돼도 문제없다.
 */
@Getter
public class QuizWordDto {

    private final Long id;
    private final String word;
    private final String answer;
    private final List<String> options;
    private final String description;

    public QuizWordDto(QuizWord quizWord) {
        this.id = quizWord.getId();
        this.word = quizWord.getWord();
        this.answer = quizWord.getAnswer();
        this.options = quizWord.getOptions();
        this.description = quizWord.getDescription();
    }
}
