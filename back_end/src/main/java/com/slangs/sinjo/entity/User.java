package com.slangs.sinjo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column
    private String password; // 소셜 가입자는 비밀번호 없음

    //    소셜 로그인
    @Enumerated(EnumType.STRING)
    @Column
    private Provider provider = Provider.LOCAL;
    private String providerId;

    @Column(nullable = false)
    private String nickname;

    /**
     * 권한. 기본값은 USER.
     *
     * EnumType.STRING 을 쓰는 이유:
     * 기본값인 ORDINAL 은 순서를 숫자로 저장하는데(USER=0, ADMIN=1),
     * 나중에 enum 에 값을 하나 끼워 넣으면 기존 데이터의 의미가 통째로 바뀐다.
     * 문자열로 저장하면 그럴 일이 없고 DB 를 열어봐도 바로 읽힌다.
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role = Role.USER;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    public void updateLastLoginAt() {
        this.lastLoginAt = LocalDateTime.now();
    }

    /** 관리자 여부. 화면과 API 양쪽에서 쓴다. */
    public boolean isAdmin() {
        return this.role == Role.ADMIN;
    }
}
