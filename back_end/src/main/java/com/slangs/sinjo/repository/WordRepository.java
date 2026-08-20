package com.slangs.sinjo.repository;

import com.slangs.sinjo.entity.Word;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

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
     * 좋아요 +1
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
                UPDATE Word w
                SET w.likes = w.likes + 1
                WHERE w.id = :id
            """)
    int increaseLike(@Param("id") Long id);

    @Query("""
        select distinct w.category
        from Word w
        where w.category is not null
        order by w.category
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
    int increaseView(@Param("id") Long id);
}
