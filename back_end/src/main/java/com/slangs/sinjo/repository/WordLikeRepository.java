package com.slangs.sinjo.repository;

import com.slangs.sinjo.entity.WordLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WordLikeRepository
        extends JpaRepository<WordLike, Long> {

    /**
     * 특정 사용자가 특정 신조어에 이미 좋아요를 눌렀는지 확인한다.
     */
    boolean existsByWordIdAndUserId(
            Long wordId,
            Long userId
    );

    /**
     * 특정 신조어의 좋아요 기록 삭제.
     * <p>
     * 신조어 삭제 시 FK 제약에 걸리지 않도록
     * Word 삭제 전에 좋아요 기록을 먼저 삭제한다.
     */
    @Modifying
    @Query("""
            DELETE FROM WordLike wl
            WHERE wl.word.id = :wordId
            """)
    int deleteAllByWordId(
            @Param("wordId") Long wordId
    );
}
