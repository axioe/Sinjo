package com.slangs.sinjo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 로그인 이력.
 *
 * User.lastLoginAt 은 마지막 접속만 덮어쓰기 때문에
 * "그날 몇 명이 접속했는지"를 셀 수 없다.
 * 접속할 때마다 한 줄씩 쌓아 일별 집계를 가능하게 한다.
 */
@Entity
@Table(name = "login_history")
@Getter
@NoArgsConstructor
public class LoginHistory extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Favorites.wordId 처럼 FK 없이 순수 Long 으로 둔다. */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    public LoginHistory(Long userId) {
        this.userId = userId;
    }
}