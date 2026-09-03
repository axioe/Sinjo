package com.slangs.sinjo.repository;

import com.slangs.sinjo.entity.WordProposalVote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WordProposalVoteRepository
        extends JpaRepository<WordProposalVote, Long> {

    boolean existsByCandidateIdAndUserId(
            Long candidateId,
            Long userId
    );

    Optional<WordProposalVote> findByCandidateIdAndUserId(
            Long candidateId,
            Long userId
    );
}