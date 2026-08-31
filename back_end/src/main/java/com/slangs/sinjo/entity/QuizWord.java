package com.slangs.sinjo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@NoArgsConstructor
public class QuizWord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * [수정] unique 제약을 없앴다. 같은 단어라도 객관식용/초성용처럼 문제를
     * 여러 개 만들 수 있어야 하는데, 예전엔 유니크 제약 때문에 단어당 문제
     * 하나만 등록할 수 있었다.
     *
     * 참고: ddl-auto=update 는 스키마에서 뺀 제약을 실제 DB 에서 자동으로
     * 지워주지 않는다. quiz_word.word 에 걸려 있던 제약(quiz_word_word_key)은
     * 지웠지만, 같은 컬럼의 유니크 인덱스(ukjaovc04gegcjxbfrnpmn5nitt)가
     * 다른 작업과 겹쳐 아직 남아 있다 - 그게 정리되기 전까지는 중복 단어
     * 등록이 GlobalExceptionHandler.handleDataIntegrityViolation 에서 409 로
     * 막힌다. 인덱스가 정리되면 이 코드는 손댈 필요 없이 그대로 동작한다.
     */
    @Column(nullable = false)
    private String word; // 신조어 (예: "억까")

    @Column(nullable = false, length = 500)
    private String answer; // 뜻/풀이 (예: "억지로 까기")

    @ElementCollection
    @Column(length = 500)
    private List<String> options = new ArrayList<>(); // 객관식용 오답 보기 리스트

    @Column(length = 500)
    private String description; // 힌트 또는 예문

    /**
     * [추가] 사전(Word) 연동 - REQ-QUIZ-LINK.
     * Favorites.wordId/Translations.userId 와 같은 방식으로 FK 가 아닌 순수 Long 이다.
     * 사전에서 단어를 지워도 이 값이 남아있는 quiz_word 삭제/수정이 막히지 않는다
     * (참고용 연결일 뿐, 무결성을 강제하지 않는다). null 이면 사전과 연동되지 않은
     * 직접 입력 문제라는 뜻이다.
     */
    @Column(name = "word_id")
    private Long wordId;

    public QuizWord(String word, String answer, List<String> options, String description, Long wordId) {
        this.word = word;
        this.answer = answer;
        this.options = options;
        this.description = description;
        this.wordId = wordId;
    }

    /**
     * 관리자 수정용.
     * options 는 필드 참조를 통째로 바꾸지 않고 clear + addAll 한다.
     * Hibernate 가 관리하는 컬렉션(PersistentBag)을 새 리스트로 교체하면
     * 컬렉션 오너십 예외가 날 수 있어서다.
     */
    public void update(String word, String answer, List<String> options, String description, Long wordId) {
        this.word = word;
        this.answer = answer;
        this.options.clear();
        if (options != null) {
            this.options.addAll(options);
        }
        this.description = description;
        this.wordId = wordId;
    }
}