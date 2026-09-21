package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.TranslationLimitDto;
import com.slangs.sinjo.entity.TranslationUsage;
import com.slangs.sinjo.exception.UnauthorizedException;
import com.slangs.sinjo.repository.TranslationUsageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

/**
 * 하루 번역(신조어 검색) 사용 횟수 제한 (REQ-TR).
 * <p>
 * 비로그인 사용자는 애초에 번역 기능을 쓸 수 없고(WordController.search 에서 이 서비스가
 * UnauthorizedException 을 던진다), 로그인 사용자는 하루 {@link #DAILY_LIMIT}건까지만
 * 검색할 수 있다. 포인트 상점의 "번역권"(PointShopItemType.TRANSLATION_EXTRA)을 사면
 * {@link #addBonus} 로 그날의 한도가 늘어난다 - PointService.purchase 가 호출한다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TranslationLimitService {

    public static final int DAILY_LIMIT = 10;

    private final TranslationUsageRepository translationUsageRepository;

    /** 마이페이지 "오늘의 번역 사용량" 카드용. */
    public TranslationLimitDto.Usage getTodayUsage(Long userId) {
        if (userId == null) {
            throw new UnauthorizedException();
        }

        TranslationUsage usage = translationUsageRepository
                .findByUserIdAndUsageDate(userId, LocalDate.now())
                .orElse(null);

        int used = usage == null ? 0 : usage.getCount();
        int limit = DAILY_LIMIT + (usage == null ? 0 : usage.getBonusLimit());

        return new TranslationLimitDto.Usage(used, limit);
    }

    /**
     * 번역(신조어 검색) 요청 직전에 호출한다.
     * 오늘 이미 한도를 다 썼으면 IllegalStateException(400) 으로 막고, 아니면 카운트를 늘린다.
     */
    @Transactional
    public void checkAndIncrement(Long userId) {
        if (userId == null) {
            throw new UnauthorizedException();
        }

        LocalDate today = LocalDate.now();
        TranslationUsage usage = translationUsageRepository.findForUpdate(userId, today)
                .orElse(null);

        int effectiveLimit = DAILY_LIMIT + (usage == null ? 0 : usage.getBonusLimit());

        if (usage != null && usage.getCount() >= effectiveLimit) {
            throw new IllegalStateException(
                    "오늘의 번역 가능 횟수(" + effectiveLimit + "건)를 모두 사용했습니다."
            );
        }

        if (usage == null) {
            usage = new TranslationUsage(userId, today);
            translationUsageRepository.save(usage);
        }

        usage.increment();
    }

    /**
     * 포인트 상점 "번역권" 구매 시 호출한다 - 오늘의 한도를 amount 만큼 늘린다.
     * 하루가 지나면 TranslationUsage 자체가 새 행(다음 날짜)으로 바뀌므로 자동으로 초기화된다.
     */
    @Transactional
    public void addBonus(Long userId, int amount) {
        LocalDate today = LocalDate.now();
        TranslationUsage usage = translationUsageRepository.findForUpdate(userId, today)
                .orElse(null);

        if (usage == null) {
            usage = new TranslationUsage(userId, today);
            translationUsageRepository.save(usage);
        }

        usage.addBonus(amount);
    }
}
