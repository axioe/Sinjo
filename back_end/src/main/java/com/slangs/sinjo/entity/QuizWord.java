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

    @Column(nullable = false, unique = true)
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