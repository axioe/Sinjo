package com.slangs.sinjo.repository;

import com.slangs.sinjo.entity.WordProposalVote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WordProposalVoteRepository extends JpaRepository<WordProposalVote, Long> {

    Optional<WordProposalVote> findByProposalIdAndUserId(Long proposalId, Long userId);

    boolean existsByProposalIdAndUserId(Long proposalId, Long userId);

    long countByProposalIdAndType(Long proposalId, com.slangs.sinjo.entity.VoteType type);

    void deleteByProposalId(Long proposalId);
}
