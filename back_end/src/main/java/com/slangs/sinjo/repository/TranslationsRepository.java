package com.slangs.sinjo.repository;

import com.slangs.sinjo.entity.Translations;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TranslationsRepository extends JpaRepository<Translations, Long> {
    Page<Translations> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    void deleteByUserIdAndOriginalText(Long userId, String originalText);

    /** MyPageService.saveHistory 에서 포인트를 새 번역에만 적립하려고 저장 전에 확인한다. */
    boolean existsByUserIdAndOriginalText(Long userId, String originalText);

    long countByUserId(Long userId);
}
