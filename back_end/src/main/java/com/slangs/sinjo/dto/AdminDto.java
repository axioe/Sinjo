package com.slangs.sinjo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * 관리자 화면 전용 요청 양식 (REQ-ADM-01)
 */
public class AdminDto {

    public record WordRequest(

            @NotBlank(message = "신조어를 입력해 주세요.")
            @Size(max = 20, message = "신조어는 20자 이하여야 합니다.")
            String word,

            @NotBlank(message = "뜻을 입력해 주세요.")
            @Size(max = 100, message = "뜻은 100자 이하여야 합니다.")
            String meaning,

            @NotBlank(message = "예문을 입력해 주세요.")
            @Size(max = 50, message = "예문은 50자 이하여야 합니다.")
            String example,

            @NotBlank(message = "카테고리를 선택해 주세요.")
            @Size(max = 10, message = "카테고리는 10자 이하여야 합니다.")
            String category,

            @Size(max = 20, message = "시대는 20자 이하여야 합니다.")
            String era
    ) {
    }

    /**
     * 관리자 페이지 첫 화면의 요약 숫자
     */
    public record Summary(
            long totalUsers,
            long totalWords,
            long totalQuizzes
    ) {
    }

    /**
     * [추가] 퀴즈 문제 등록/수정 요청.
     * options 는 객관식 오답 보기다 - 비워 둬도 등록은 되지만,
     * 그 문제는 객관식 게임에서 정답 보기 1개만 나오게 된다.
     */
    public record QuizWordRequest(

            @NotBlank(message = "신조어를 입력해 주세요.")
            @Size(max = 20, message = "신조어는 20자 이하여야 합니다.")
            String word,

            @NotBlank(message = "뜻을 입력해 주세요.")
            @Size(max = 500, message = "뜻은 500자 이하여야 합니다.")
            String answer,

            @Size(max = 500, message = "힌트/예문은 500자 이하여야 합니다.")
            String description,

            List<String> options
    ) {
    }
}
