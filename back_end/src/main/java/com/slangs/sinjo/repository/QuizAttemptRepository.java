package com.slangs.sinjo.repository;

import com.slangs.sinjo.entity.QuizAttempt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {

    long countByUserId(Long userId);

    long countByUserIdAndCreatedAtAfter(Long userId, LocalDateTime after);

    /** 마이페이지 "게임 기록" 목록용. TranslationsRepository.findByUserIdOrderByCreatedAtDesc 와 같은 패턴. */
    Page<QuizAttempt> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /** 활동 통계 달력에서 특정 날짜를 클릭했을 때 그 날의 퀴즈 응시 기록만 뽑아온다. */
    List<QuizAttempt> findByUserIdAndCreatedAtBetween(Long userId, LocalDateTime start, LocalDateTime end);

    /** 관리자가 회원을 삭제할 때 먼저 지운다 - user_id 가 FK(nullable = false)라 남아있으면 삭제가 막힌다. */
    void deleteByUserId(Long userId);
}
