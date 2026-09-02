package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.FavoritesDto;
import com.slangs.sinjo.dto.QuizAttemptDto;
import com.slangs.sinjo.dto.TranslationDto;
import com.slangs.sinjo.dto.TranslationSaveRequest;
import com.slangs.sinjo.entity.Favorites;
import com.slangs.sinjo.entity.QuizAttempt;
import com.slangs.sinjo.entity.TranslationMode;
import com.slangs.sinjo.entity.Translations;
import com.slangs.sinjo.repository.FavoritesRepository;
import com.slangs.sinjo.repository.QuizAttemptRepository;
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
    private final QuizAttemptRepository quizAttemptRepository;
    private final PointService pointService;

    /** [추가] 번역 저장 1건당 적립 포인트. PointService.SHOP_ITEMS 참고 - 가격 기준으로 정한 값이다. */
    private static final int TRANSLATE_SAVE_POINT = 10;

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

        // [수정] 같은 단어를 다시 조회하면 지우고 새로 쌓는 방식이라, 저장 자체는 항상
        // 일어난다. 포인트는 "새로운" 번역일 때만 적립해야 한다 - 안 그러면 같은
        // 단어를 반복 조회하는 것만으로 포인트를 무한히 쌓을 수 있다(삭제→재생성이
        // 매번 새 저장으로 보이기 때문). 그래서 삭제하기 전에 원래 있었는지부터 본다.
        boolean isNewTranslation = !translationsRepository.existsByUserIdAndOriginalText(userId, request.originalText());

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

        if (isNewTranslation) {
            pointService.earn(userId, TRANSLATE_SAVE_POINT, "번역 저장");
        }
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

    /* ===================== 게임 기록 (REQ-MY-01) ===================== */

    public List<QuizAttemptDto> getGameHistory(Long userId, int page, int size) {
        Page<QuizAttempt> result = quizAttemptRepository
                .findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size));

        return result.getContent().stream()
                .map(QuizAttemptDto::from)
                .toList();
    }
}