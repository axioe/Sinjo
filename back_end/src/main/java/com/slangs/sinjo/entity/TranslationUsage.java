package com.slangs.sinjo.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 하루 번역(신조어 검색) 사용 횟수 1건 (REQ-TR).
 * <p>
 * Translations 와 같은 방식으로 user_id 를 FK 가 아니라 소프트 참조로만 둔다 -
 * 회원이 탈퇴해도 그날의 사용량 집계 자체는 남아 있어도 무방하기 때문이다.
 * (user_id, usage_date) 유니크 제약으로 하루 1행만 존재하고, 그 행의 count 를
 * 검색할 때마다 늘려서 한도를 넘었는지 판단한다.
 */
@Entity
@Table(
        name = "translation_usages",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_translation_usage_user_date",
                columnNames = {"user_id", "usage_date"}
        )
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TranslationUsage extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "usage_date", nullable = false)
    private LocalDate usageDate;

    @Column(nullable = false)
    private int count;

    /** 포인트 상점의 "번역권" 구매로 늘어난 오늘의 추가 한도. 기본 0. */
    @Column(name = "bonus_limit", nullable = false)
    private int bonusLimit;

    public TranslationUsage(Long userId, LocalDate usageDate) {
        this.userId = userId;
        this.usageDate = usageDate;
        this.count = 0;
        this.bonusLimit = 0;
    }

    public void increment() {
        this.count++;
    }

    public void addBonus(int amount) {
        this.bonusLimit += amount;
    }
}
