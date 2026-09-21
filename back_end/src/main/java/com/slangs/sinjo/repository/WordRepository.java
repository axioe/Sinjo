package com.slangs.sinjo.repository;

import com.slangs.sinjo.entity.Word;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface WordRepository
        extends JpaRepository<Word, Long> {

    /**
     * 좋아요 기준 TOP 5
     */
    List<Word> findTop5ByOrderByLikesDescIdAsc();

    /**
     * 관리자 등록 시 중복 확인
     */
    boolean existsByWord(String word);

    /**
     * 수정 시 자기 자신 제외하고 중복 확인
     */
    boolean existsByWordAndIdNot(String word, Long id);

    /**
     * 관리자 목록
     */
    List<Word> findAllByOrderByIdDesc();

    /**
     * 좋아요 처리용 단어 조회.
     * <p>
     * 같은 신조어에 동시에 좋아요 요청이 들어오는 경우
     * Word 행을 잠가서 좋아요 중복 처리를 안전하게 한다.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT w
            FROM Word w
            WHERE w.id = :id
            """)
    Optional<Word> findByIdForLike(
            @Param("id") Long id
    );

    /**
     * 좋아요 +1
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE Word w
            SET w.likes = w.likes + 1
            WHERE w.id = :id
            """)
    int increaseLike(
            @Param("id") Long id
    );

    @Query("""
            SELECT DISTINCT w.category
            FROM Word w
            WHERE w.category IS NOT NULL
            ORDER BY w.category
            """)
    List<String> findCategories();

    /**
     * 조회수 +1
     * <p>
     * DB에서 직접 증가시키므로
     * 동시에 여러 명이 조회해도 조회수가 유실되지 않는다.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE Word w
            SET w.views = w.views + 1
            WHERE w.id = :id
            """)
    int increaseView(
            @Param("id") Long id
    );
}
