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
     * 좋아요 기준 인기 TOP 5
     */
    List<Word> findTop5ByOrderByLikesDescIdAsc();

    /**
     * 단어 중복 확인
     */
    boolean existsByWord(String word);

    /**
     * 수정 시 자기 자신을 제외한 중복 확인
     */
    boolean existsByWordAndIdNot(
            String word,
            Long id
    );

    /**
     * 관리자 목록
     */
    List<Word> findAllByOrderByIdDesc();

    /**
     * 좋아요 +1
     */
    @Modifying(
            clearAutomatically = true,
            flushAutomatically = true
    )
    @Query("""
            UPDATE Word w
            SET w.likes = w.likes + 1
            WHERE w.id = :id
            """)
    int increaseLike(
            @Param("id") Long id
    );

    /**
     * 좋아요 -1
     * <p>
     * likes가 0보다 작아지지 않도록 방어한다.
     */
    @Modifying(
            clearAutomatically = true,
            flushAutomatically = true
    )
    @Query("""
            UPDATE Word w
            SET w.likes = w.likes - 1
            WHERE w.id = :id
              AND w.likes > 0
            """)
    int decreaseLike(
            @Param("id") Long id
    );

    /**
     * 좋아요 처리 시 Word 행을 잠근다.
     * <p>
     * 같은 단어에 동시에 좋아요/취소 요청이 들어오는 경우
     * 중복 검사와 likes 변경을 안전하게 처리하기 위해 사용한다.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT w
            FROM Word w
            WHERE w.id = :id
            """)
    Optional<Word> findByIdForUpdate(
            @Param("id") Long id
    );

    /**
     * 카테고리 목록
     */
    @Query("""
            SELECT DISTINCT w.category
            FROM Word w
            WHERE w.category IS NOT NULL
            ORDER BY w.category
            """)
    List<String> findCategories();

    /**
     * 조회수 +1
     */
    @Modifying(
            clearAutomatically = true,
            flushAutomatically = true
    )
    @Query("""
            UPDATE Word w
            SET w.views = w.views + 1
            WHERE w.id = :id
            """)
    int increaseView(
            @Param("id") Long id
    );
}
