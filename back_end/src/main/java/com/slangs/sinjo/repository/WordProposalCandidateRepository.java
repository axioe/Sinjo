package com.slangs.sinjo.repository;

import com.slangs.sinjo.entity.WordProposalCandidate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WordProposalCandidateRepository
        extends JpaRepository<WordProposalCandidate, Long> {

    List<WordProposalCandidate> findByProposalIdOrderByLikesDescCreatedAtAsc( Long proposalId );
    boolean existsByProposalIdAndWord( Long proposalId, String word );
    /** * 특정 후보가 특정 제안에 속하는지 확인하기 위한 조회 */
    java.util.Optional<WordProposalCandidate> findByIdAndProposalId( Long id, Long proposalId );
}
