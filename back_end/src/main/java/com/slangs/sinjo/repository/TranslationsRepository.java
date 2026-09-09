package com.slangs.sinjo.repository;

import com.slangs.sinjo.entity.Translations;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface TranslationsRepository extends JpaRepository<Translations, Long> {
    Page<Translations> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    void deleteByUserIdAndOriginalText(Long userId, String originalText);

    /** MyPageService.saveHistory 에서 포인트를 새 번역에만 적립하려고 저장 전에 확인한다. */
    boolean existsByUserIdAndOriginalText(Long userId, String originalText);

    long countByUserId(Long userId);

    /** 활동 통계 달력에서 특정 날짜를 클릭했을 때 그 날의 번역 기록만 뽑아온다. */
    List<Translations> findByUserIdAndCreatedAtBetween(Long userId, LocalDateTime start, LocalDateTime end);
}
