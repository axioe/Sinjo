package com.slangs.sinjo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "word_proposal_reviews",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_word_proposal_review_proposal",
                columnNames = "proposal_id"
        )
)
@Getter
@Setter
@NoArgsConstructor
public class WordProposalReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 검수 대상 제안
     *
     * 하나의 제안에는 최신 AI 검수 결과 하나만 유지
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "proposal_id",
            nullable = false,
            unique = true
    )
    private WordProposal proposal;

    /**
     * ------------------------------------------------------------
     * AI 제안 검수 결과
     * ------------------------------------------------------------
     */

    /**
     * 기존 단어와 중복되는지 여부
     */
    @Column(nullable = false)
    private Boolean duplicate;

    /**
     * AI가 추천하는 카테고리
     */
    @Column(length = 100)
    private String recommendedCategory;

    /**
     * APPROVE / REJECT / REVIEW 등
     */
    @Column(length = 30)
    private String recommendation;

    /**
     * AI 판단 신뢰도
     */
    private Double confidence;

    /**
     * AI의 제안 검수 의견
     */
    @Column(length = 2000)
    private String opinion;

    /**
     * ------------------------------------------------------------
     * AI 최종 요약
     * ------------------------------------------------------------
     */

    /**
     * 최종 추천 결과
     */
    @Column(length = 30)
    private String summaryRecommendation;

    /**
     * 관리자에게 보여줄 최종 검수 의견
     */
    @Column(length = 3000)
    private String summaryOpinion;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    public void prePersist() {

        LocalDateTime now = LocalDateTime.now();

        this.createdAt = now;
        this.updatedAt = now;

        if (this.duplicate == null) {
            this.duplicate = false;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}