package com.slangs.sinjo.repository;

import com.slangs.sinjo.entity.Translations;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TranslationsRepository extends JpaRepository<Translations, Long> {
    Page<Translations> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    long countByUserId(Long userId);
}
