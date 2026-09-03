package com.slangs.sinjo.repository;

import com.slangs.sinjo.entity.WordProposalComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WordProposalCommentRepository
        extends JpaRepository<WordProposalComment, Long> {

    List<WordProposalComment>
    findByProposalIdAndParentIsNullOrderByCreatedAtAsc(
            Long proposalId
    );

    List<WordProposalComment>
    findByParentIdOrderByCreatedAtAsc(
            Long parentId
    );

    long countByProposalId(Long proposalId);
}