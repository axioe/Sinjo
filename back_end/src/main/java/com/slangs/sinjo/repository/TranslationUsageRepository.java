package com.slangs.sinjo.repository;

import com.slangs.sinjo.entity.TranslationUsage;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;

public interface TranslationUsageRepository extends JpaRepository<TranslationUsage, Long> {

    Optional<TranslationUsage> findByUserIdAndUsageDate(Long userId, LocalDate usageDate);

    /**
     * 오늘 사용량 확인 + 증가를 한 요청 안에서 안전하게 처리하기 위해 행을 잠근다.
     * 같은 사용자가 짧은 시간에 여러 번 요청해도 한도를 넘겨 세지 않는다.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT t
            FROM TranslationUsage t
            WHERE t.userId = :userId AND t.usageDate = :usageDate
            """)
    Optional<TranslationUsage> findForUpdate(
            @Param("userId") Long userId,
            @Param("usageDate") LocalDate usageDate
    );
}
