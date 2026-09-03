package com.slangs.sinjo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "word_proposal_candidates")
@Getter
@Setter
@NoArgsConstructor
public class WordProposalCandidate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 어느 신조어 제안에서 나온 후보인가?
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proposal_id", nullable = false)
    private WordProposal proposal;

    /**
     * 어느 댓글에서 제안했는가?
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comment_id")
    private WordProposalComment comment;

    /**
     * 후보 Word를 제안한 사용자
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 100)
    private String word;

    @Column(nullable = false, length = 500)
    private String meaning;

    @Column(nullable = false, length = 500)
    private String example;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    private Long likes = 0L;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CandidateStatus status;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();

        if (this.status == null) {
            this.status = CandidateStatus.PENDING;
        }
    }

    public void increaseLike() {
        this.likes++;
    }
}