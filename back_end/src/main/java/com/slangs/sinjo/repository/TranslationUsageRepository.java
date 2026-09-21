package com.slangs.sinjo.repository;

import com.slangs.sinjo.entity.TranslationUsage;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TranslationUsageRepository extends JpaRepository<TranslationUsage, Long> {

    Optional<TranslationUsage> findByUserIdAndUsageDate(Long userId, LocalDate usageDate);

    /**
     * 관리자 대시보드 "번역 횟수" 추이용 - 날짜별 전체 사용자 합계.
     * usageDate 가 이미 LocalDate 라 UserRepository.countDailySignups 처럼 function('date', ...)
     * 로 변환할 필요가 없다. AdminService.toDailyCounts 가 row[0].toString() 을
     * "yyyy-MM-dd" 로 기대하는데 LocalDate.toString() 이 그 형식이라 그대로 맞는다.
     */
    @Query("""
            SELECT t.usageDate, SUM(t.count)
            FROM TranslationUsage t
            WHERE t.usageDate >= :from
            GROUP BY t.usageDate
            ORDER BY t.usageDate
            """)
    List<Object[]> countDailyTranslations(@Param("from") LocalDate from);

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
