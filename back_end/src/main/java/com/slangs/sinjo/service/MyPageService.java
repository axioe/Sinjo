package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.FavoritesDto;
import com.slangs.sinjo.dto.TranslationDto;
import com.slangs.sinjo.dto.TranslationSaveRequest;
import com.slangs.sinjo.entity.Favorites;
import com.slangs.sinjo.entity.TranslationMode;
import com.slangs.sinjo.entity.Translations;
import com.slangs.sinjo.repository.FavoritesRepository;
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
    private final FavoritesRepository favoritesRepository;

    /* ===================== 변환 이력 (REQ-AUTH-02) ===================== */

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

        // 같은 단어를 다시 조회하면 기존 기록을 지우고 새로 쌓는다(번역 페이지 동작과 맞춤).
        translationsRepository.deleteByUserIdAndOriginalText(userId, request.originalText());

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

    /* ===================== 즐겨찾기 (REQ-MY-01) ===================== */

    public List<FavoritesDto> getFavorites(Long userId, int page, int size) {
        return favoritesRepository
                .findFavorites(userId, PageRequest.of(page, size))
                .getContent();
    }

    public long getFavoriteCount(Long userId) {
        return favoritesRepository.countByUserId(userId);
    }

    /**
     * 즐겨찾기 등록.
     * 이미 등록된 단어면 아무것도 하지 않는다(중복 요청은 성공으로 취급).
     */
    @Transactional
    public void addFavorite(Long userId, Long wordId) {

        if (userId == null) return;
        if (favoritesRepository.existsByUserIdAndWordId(userId, wordId)) return;

        favoritesRepository.save(
                Favorites.builder()
                        .userId(userId)
                        .wordId(wordId)
                        .build()
        );
    }

    @Transactional
    public void removeFavorite(Long userId, Long wordId) {

        if (userId == null) return;

        favoritesRepository.deleteByUserIdAndWordId(userId, wordId);
    }
}