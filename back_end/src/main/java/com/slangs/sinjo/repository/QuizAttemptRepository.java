package com.slangs.sinjo.repository;

import com.slangs.sinjo.entity.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {

    long countByUserId(Long userId);

    long countByUserIdAndCreatedAtAfter(Long userId, LocalDateTime after);

    /** 관리자가 회원을 삭제할 때 먼저 지운다 - user_id 가 FK(nullable = false)라 남아있으면 삭제가 막힌다. */
    void deleteByUserId(Long userId);
}
