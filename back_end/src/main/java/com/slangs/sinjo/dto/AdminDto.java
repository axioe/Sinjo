package com.slangs.sinjo.dto;

import com.slangs.sinjo.entity.PointShopItemType;
import com.slangs.sinjo.entity.Role;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
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
     * wordId 는 사전 연동 - REQ-QUIZ-LINK. 사전에서 단어를 골라 만든 문제면 그 Word.id,
     * 직접 입력한 문제면 null 이다.
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

            List<String> options,

            Long wordId
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

    /**
     * [추가] 포인트 상점 항목 등록/수정 요청.
     * 가격을 여기서도 검증하지만, 구매 시 최종 검증은 PointService 가 DB 값으로
     * 다시 한다 - AdminDto 검증은 화면 입력 실수를 막기 위한 것일 뿐이다.
     * <p>
     * type 이 TRANSLATION_EXTRA(번역권)일 때만 effectValue(구매 1회당 늘어나는 오늘의
     * 번역 가능 횟수)가 의미를 갖는다 - 유효성 검증은 AdminService 에서 한다(레코드
     * 검증만으로는 "type 에 따라 다른 필드가 필수"를 표현할 수 없어서).
     */
    public record PointShopItemRequest(
            @NotBlank(message = "상품명을 입력해 주세요.")
            @Size(max = 100, message = "상품명은 100자 이하여야 합니다.")
            String name,

            @NotNull(message = "가격을 입력해 주세요.")
            @Positive(message = "가격은 1 이상이어야 합니다.")
            Integer price,

            @Size(max = 300, message = "설명은 300자 이하여야 합니다.")
            String description,

            @Size(max = 8, message = "아이콘은 8자 이하여야 합니다.")
            String icon,

            @NotNull(message = "상품 유형을 선택해 주세요.")
            PointShopItemType type,

            @Positive(message = "추가 횟수는 1 이상이어야 합니다.")
            Integer effectValue
    ) {
    }

//    통계 대시보드
    public record DailyCount(String date, long count) {}
}
