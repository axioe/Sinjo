package com.slangs.sinjo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class QuizDto {

    /**
     * [추가] 퀴즈 종류.
     *
     * 채점 기준이 종류마다 다르기 때문에 반드시 필요하다.
     *  - 객관식     : "뜻" 을 고르는 문제  → answer(뜻) 와 비교
     *  - 초성/주관식 : "신조어" 를 맞히는 문제 → word(단어) 와 비교
     *
     * 이 값이 없으면, 주관식 문제 지문이 "다음 뜻에 해당하는 신조어는?: (뜻)" 이라서
     * 지문에 적힌 뜻을 그대로 복사해 붙여넣어도 정답 처리되는 구멍이 생긴다.
     */
    public enum QuizType {
        MULTIPLE_CHOICE,
        INITIAL_SOUND,
        SUBJECTIVE
    }

    /** 객관식. 정답은 내려주지 않는다(브라우저에서 들여다볼 수 있으므로). */
    public record MultipleChoice(
            Long id,
            String word,
            List<String> options,
            String description
    ) {}

    public record InitialSound(
            Long id,
            String initialSound,
            String hint
    ) {}

    public record Subjective(
            Long id,
            String question,
            String description
    ) {}

    /**
     * [수정] quizId 와 answer 에 검증을 걸었다.
     * 전에는 null 이 들어오면 QuizService 의 request.answer().trim() 에서
     * NPE 가 나 500 으로 떨어졌다. 이제 400 과 함께 무엇이 잘못됐는지 내려준다.
     */
    public record CheckRequest(
            @NotNull(message = "퀴즈 ID가 필요합니다.")
            Long quizId,

            @NotBlank(message = "정답을 입력해 주세요.")
            String answer,

            /** null 이면 기존처럼 뜻/단어 아무거나 맞으면 정답 처리한다(하위 호환). */
            QuizType quizType
    ) {}

    /**
     * 채점 결과.
     * correct 로 이름을 바꾼 이유는, isCorrect 로 두면 JSON 직렬화 규칙에 따라
     * 프론트에서 받는 키 이름이 달라질 수 있어서다. 이름을 맞춰 혼란을 없앤다.
     * correctAnswer 는 오답일 때 화면에 정답을 보여주기 위해 함께 내려준다.
     */
    public record CheckResponse(
            boolean correct,
            String correctAnswer
    ) {}
}
