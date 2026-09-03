package com.slangs.sinjo.repository;

import com.slangs.sinjo.entity.ProposalStatus;
import com.slangs.sinjo.entity.WordProposal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WordProposalRepository
        extends JpaRepository<WordProposal, Long> {

    boolean existsByProposedWord(String proposedWord);
    List<WordProposal> findAllByOrderByCreatedAtDesc();
    Optional<WordProposal> findById(Long id);
}