package com.slangs.sinjo.repository;

import com.slangs.sinjo.entity.WordProposalReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WordProposalReviewRepository
        extends JpaRepository<WordProposalReview, Long> {

    Optional<WordProposalReview> findByProposalId(Long proposalId);
}