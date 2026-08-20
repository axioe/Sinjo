package com.slangs.sinjo.dto;

import com.slangs.sinjo.entity.Role;
import com.slangs.sinjo.entity.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

/**
 * 요청과 응답을 나눴다.
 * 하나로 쓰면 응답 JSON 에 password 필드가 그대로 실려 나간다.
 */
public class UserDto {

    public record SignupRequest(
            @NotBlank(message = "이메일을 입력해 주세요.")
            @Email(message = "이메일 형식이 올바르지 않습니다.")
            String email,

            @NotBlank(message = "비밀번호를 입력해 주세요.")
            @Size(min = 8, max = 64, message = "비밀번호는 8자 이상이어야 합니다.")
            String password,

            @NotBlank(message = "닉네임을 입력해 주세요.")
            @Size(min = 2, max = 30, message = "닉네임은 2자 이상 30자 이하여야 합니다.")
            String nickname
    ) {
    }

    public record LoginRequest(
            @NotBlank(message = "이메일을 입력해 주세요.")
            String email,

            @NotBlank(message = "비밀번호를 입력해 주세요.")
            String password
    ) {
    }

    /**
     * 응답에는 비밀번호를 절대 담지 않는다.
     *
     * role 을 포함하는 이유:
     * 프론트가 로그인 직후 관리자인지 판단해 어디로 보낼지 정해야 하고,
     * 헤더 버튼도 이 값으로 갈린다.
     */
    public record Response(
            Long id,
            String email,
            String nickname,
            Role role,
            LocalDateTime createdAt,
            LocalDateTime lastLoginAt
    ) {
        public static Response from(User user) {
            return new Response(
                    user.getId(),
                    user.getEmail(),
                    user.getNickname(),
                    user.getRole(),
                    user.getCreatedAt(),
                    user.getLastLoginAt()
            );
        }
    }

    public record LoginResponse(
            String token,
            Response user
    ) {}

    /** 관리자 화면의 회원 목록용. 개인정보를 최소한으로 담는다. */
    public record AdminUserRow(
            Long id,
            String email,
            String nickname,
            Role role,
            LocalDateTime createdAt,
            LocalDateTime lastLoginAt
    ) {
        public static AdminUserRow from(User user) {
            return new AdminUserRow(
                    user.getId(),
                    user.getEmail(),
                    user.getNickname(),
                    user.getRole(),
                    user.getCreatedAt(),
                    user.getLastLoginAt()
            );
        }
    }
}
