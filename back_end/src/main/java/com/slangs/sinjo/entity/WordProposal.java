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

    @Column(nullable = false, length = 100)
    private String proposedWord;

    @Column(nullable = false, length = 500)
    private String meaning;

    @Column(nullable = false, length = 500)
    private String example;

    @Column(length = 1000)
    private String description;

    @Column(length = 500)
    private String sourceDescription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProposalStatus status;

    @Column(nullable = false)
    private Long views = 0L;

    @Column(nullable = false)
    private Long commentCount = 0L;

    @Column(nullable = false)
    private Long likes = 0L;

    @Column(nullable = false)
    private Long dislikes = 0L;

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

        if (this.likes == null) {
            this.likes = 0L;
        }

        if (this.dislikes == null) {
            this.dislikes = 0L;
        }

        if (this.views == null) {
            this.views = 0L;
        }

        if (this.commentCount == null) {
            this.commentCount = 0L;
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

    public void increaseDislike() {
        this.dislikes++;
    }
}