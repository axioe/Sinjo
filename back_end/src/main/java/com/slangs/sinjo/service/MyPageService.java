package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.TranslationDto;
import com.slangs.sinjo.dto.TranslationSaveRequest;
import com.slangs.sinjo.entity.TranslationMode;
import com.slangs.sinjo.entity.Translations;
import com.slangs.sinjo.repository.TranslationsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MyPageService {

    private final TranslationsRepository translationsRepository;

    public List<TranslationDto> getHistory(Long userId, int page, int size) {
        Page<Translations> result = translationsRepository
                .findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size));

        return result.getContent().stream()
                .map(TranslationDto::from)
                .toList();
    }

    public long getTranslationCount(Long userId) {
        return translationsRepository.countByUserId(userId);
    }

    /**
     * 번역 이력 저장 (REQ-AUTH-02)
     * 클래스에 readOnly = true 가 걸려 있어 쓰기 메서드에는 @Transactional 을 따로 붙인다.
     */
    @Transactional
    public void saveHistory(Long userId, TranslationSaveRequest request) {

        if (userId == null) return;

        translationsRepository.save(
                Translations.builder()
                        .userId(userId)
                        .mode(TranslationMode.EXPLAIN)
                        .originalText(request.originalText())
                        .translatedText(request.translatedText())
                        .explanation(request.explanation())
                        .build()
        );
    }
}

