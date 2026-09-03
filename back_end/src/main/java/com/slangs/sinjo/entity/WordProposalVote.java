package com.slangs.sinjo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "word_proposal_votes",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_candidate_user",
                        columnNames = {"candidate_id", "user_id"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
public class WordProposalVote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    private WordProposalCandidate candidate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
    }
}