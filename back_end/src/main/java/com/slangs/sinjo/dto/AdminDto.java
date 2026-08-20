package com.slangs.sinjo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

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
}
