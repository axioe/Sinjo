package com.slangs.sinjo.dto;

import com.slangs.sinjo.entity.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
     * options 는 객관식 오답 보기다. 최소 개수(AdminService.MIN_QUIZ_OPTIONS) 검증은
     * 빈 값을 걸러낸 뒤에 해야 해서 여기 @Size 대신 서비스 레이어에서 한다.
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

    /**
     * [추가] 관리자 회원 관리 - 권한 부여/해제 요청.
     */
    public record UpdateRoleRequest(
            @NotNull(message = "권한을 선택해 주세요.")
            Role role
    ) {
    }

    /**
     * [추가] 관리자 회원 관리 - 닉네임 수정 요청.
     * 이메일은 로그인 식별자라 관리자 화면에서도 바꾸지 않는다.
     */
    public record UpdateUserRequest(
            @NotBlank(message = "닉네임을 입력해 주세요.")
            @Size(min = 2, max = 20, message = "닉네임은 2~20자여야 합니다.")
            String nickname
    ) {
    }
}
