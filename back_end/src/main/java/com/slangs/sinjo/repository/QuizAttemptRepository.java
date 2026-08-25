package com.slangs.sinjo.repository;

import com.slangs.sinjo.entity.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {

    long countByUserId(Long userId);

    long countByUserIdAndCreatedAtAfter(Long userId, LocalDateTime after);

    /** 이번 주 사용 기록 / 활동 통계 달력용. 날짜만 필요하니 시각만 읽어 서비스에서 날짜로 묶는다. */
    List<LocalDateTime> findCreatedAtByUserId(Long userId);
}
