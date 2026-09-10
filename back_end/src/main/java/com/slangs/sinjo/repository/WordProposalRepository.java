package com.slangs.sinjo.repository;

import com.slangs.sinjo.entity.WordProposal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WordProposalRepository
        extends JpaRepository<WordProposal, Long> {

    boolean existsByProposedWord(String proposedWord);

    List<WordProposal> findAllByOrderByCreatedAtDesc();
    /**
     * 신조어 제안 목록
     *
     * 검색:
     * - proposedWord
     * - meaning
     * - user.nickname
     *
     * 정렬:
     * - LATEST
     * - POPULAR
     * - LIKES
     * - COMMENTS
     * - VIEWS
     */
    @Query(
            value = """
                    SELECT p
                      FROM WordProposal p
                       JOIN p.user u
                    WHERE
                        :keyword = ''
                        OR LOWER(p.proposedWord) LIKE LOWER(CONCAT('%', :keyword, '%'))
                        OR LOWER(p.meaning) LIKE LOWER(CONCAT('%', :keyword, '%'))
                        OR LOWER(u.nickname) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    ORDER BY
                        CASE
                            WHEN :sortType = 'LIKES'
                            THEN p.likes
                        END DESC,

                        CASE
                            WHEN :sortType = 'COMMENTS'
                            THEN p.commentCount
                        END DESC,

                        CASE
                            WHEN :sortType = 'VIEWS'
                            THEN p.views
                        END DESC,

                        CASE
                            WHEN :sortType = 'POPULAR'
                            THEN (
                                p.likes
                                + (p.commentCount * 2)
                                + (p.views * 0.1)
                            )
                        END DESC,

                        CASE
                            WHEN :sortType = 'LATEST'
                            THEN p.createdAt
                        END DESC,

                        p.createdAt DESC
                    """,
            countQuery = """
                    SELECT COUNT(p)
                    FROM WordProposal p
                    JOIN p.user u
                    WHERE
                        :keyword = ''
                        OR LOWER(p.proposedWord) LIKE LOWER(CONCAT('%', :keyword, '%'))
                        OR LOWER(p.meaning) LIKE LOWER(CONCAT('%', :keyword, '%'))
                        OR LOWER(u.nickname) LIKE LOWER(CONCAT('%', :keyword, '%'))
                    """
    )
    Page<WordProposal> searchProposals(
            @Param("keyword") String keyword,
            @Param("sortType") String sortType,
            Pageable pageable
    );

    Optional<WordProposal> findById(Long id);

    /**
     * 자동완성 검색
     *
     * 제안 단어 / 의미 / 작성자 닉네임을 대상으로 검색
     */
    @Query("""
        SELECT DISTINCT p.proposedWord
        FROM WordProposal p
        JOIN p.user u
        WHERE
            LOWER(p.proposedWord) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(p.meaning) LIKE LOWER(CONCAT('%', :keyword, '%'))
            OR LOWER(u.nickname) LIKE LOWER(CONCAT('%', :keyword, '%'))
        ORDER BY p.proposedWord ASC
        """)
    List<String> findSuggestions(
            @Param("keyword") String keyword,
            Pageable pageable
    );
}