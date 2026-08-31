package com.slangs.sinjo.dto;

import com.slangs.sinjo.entity.QuizWord;
import lombok.Getter;

import java.util.ArrayList;
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
    private final Long wordId;

    public QuizWordDto(QuizWord quizWord) {
        this.id = quizWord.getId();
        this.word = quizWord.getWord();
        this.answer = quizWord.getAnswer();
        // [수정] getOptions() 를 그대로 대입하면 Hibernate 지연 로딩 프록시가 그대로 넘어가서,
        // 트랜잭션이 끝난 뒤 Jackson 이 JSON 으로 직렬화할 때 LazyInitializationException(no session) 이 난다.
        // ArrayList 로 감싸 트랜잭션이 살아있는 지금 내용을 읽어(초기화해) 둔다.
        this.options = new ArrayList<>(quizWord.getOptions());
        this.description = quizWord.getDescription();
        this.wordId = quizWord.getWordId();
    }
}
