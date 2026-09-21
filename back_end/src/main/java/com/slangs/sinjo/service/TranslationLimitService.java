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
 * 검색할 수 있다. 한도를 늘리는 포인트 상점 아이템은 이후 별도 작업이다.
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

        int used = translationUsageRepository.findByUserIdAndUsageDate(userId, LocalDate.now())
                .map(TranslationUsage::getCount)
                .orElse(0);

        return new TranslationLimitDto.Usage(used, DAILY_LIMIT);
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

        if (usage != null && usage.getCount() >= DAILY_LIMIT) {
            throw new IllegalStateException(
                    "오늘의 번역 가능 횟수(" + DAILY_LIMIT + "건)를 모두 사용했습니다."
            );
        }

        if (usage == null) {
            usage = new TranslationUsage(userId, today);
            translationUsageRepository.save(usage);
        }

        usage.increment();
    }
}
