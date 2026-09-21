package com.slangs.sinjo.repository;

import com.slangs.sinjo.entity.WordLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WordLikeRepository
        extends JpaRepository<WordLike, Long> {

    /**
     * 특정 사용자가 특정 단어를 좋아요했는지 확인
     */
    boolean existsByUser_IdAndWord_Id(
            Long userId,
            Long wordId
    );

    /**
     * 특정 사용자의 특정 단어 좋아요 조회
     */
    Optional<WordLike> findByUser_IdAndWord_Id(
            Long userId,
            Long wordId
    );

    /**
     * 특정 사용자가 좋아요한 모든 기록
     */
    List<WordLike> findAllByUser_Id(Long userId);

    /**
     * 특정 사용자의 특정 단어 좋아요 삭제
     */
    void deleteByUser_IdAndWord_Id(
            Long userId,
            Long wordId
    );

    /**
     * 단어 삭제 전에 해당 단어의 좋아요 기록 전체 삭제
     */
    void deleteAllByWord_Id(Long wordId);
}
