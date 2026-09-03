package com.slangs.sinjo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "word_proposal_reviews")
@Getter
@Setter
@NoArgsConstructor
public class WordProposalReview extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn( name = "proposal_id", nullable = false, unique = true )
    private WordProposal proposal;
    @Column(columnDefinition = "TEXT")
    private String rawResponse;
}