package com.slangs.sinjo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "word_proposals")
@Getter
@Setter
@NoArgsConstructor
public class WordProposal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 제안한 신조어
     */
    @Column(nullable = false, length = 100)
    private String proposedWord;

    /**
     * 어떤 의미인가요?
     */
    @Column(nullable = false, length = 500)
    private String meaning;

    /**
     * 어떻게 사용하나요?
     */
    @Column(nullable = false, length = 500)
    private String example;

    /**
     * 신조어 설명
     */
    @Column(length = 1000)
    private String description;

    /**
     * 사용처 / 발견 경로
     */
    @Column(length = 500)
    private String sourceDescription;

    /**
     * 제안자
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * 제안 상태
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProposalStatus status;

    /**
     * 조회수
     */
    @Column(nullable = false)
    private Long views = 0L;

    /**
     * 댓글 수
     */
    @Column(nullable = false)
    private Long commentCount = 0L;

    /**
     * 추천 수
     */
    @Column(nullable = false)
    private Long likes = 0L;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @Column(length = 1000)
    private String rejectReason;

    @PrePersist
    public void prePersist() {
        LocalDateTime now = LocalDateTime.now();

        this.createdAt = now;
        this.updatedAt = now;

        if (this.status == null) {
            this.status = ProposalStatus.DISCUSSION;
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public void increaseView() {
        this.views++;
    }

    public void increaseCommentCount() {
        this.commentCount++;
    }

    public void decreaseCommentCount() {
        if (this.commentCount > 0) {
            this.commentCount--;
        }
    }

    public void increaseLike() {
        this.likes++;
    }

}