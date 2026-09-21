package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.TranslationLimitDto;
import com.slangs.sinjo.entity.TranslationUsage;
import com.slangs.sinjo.exception.UnauthorizedException;
import com.slangs.sinjo.repository.TranslationUsageRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * REQ-TR: 하루 번역(신조어 검색) 횟수 제한.
 * <p>
 * 로그인하지 않으면 애초에 쓸 수 없다는 것과, 하루 10건을 넘기면 막힌다는 것이 핵심이라
 * 이 두 가지에 초점을 둔다.
 */
@ExtendWith(MockitoExtension.class)
class TranslationLimitServiceTest {

    @Mock
    private TranslationUsageRepository translationUsageRepository;

    @InjectMocks
    private TranslationLimitService translationLimitService;

    private TranslationUsage usage(long id, int count) {
        TranslationUsage usage = new TranslationUsage(1L, LocalDate.now());
        ReflectionTestUtils.setField(usage, "id", id);
        ReflectionTestUtils.setField(usage, "count", count);
        return usage;
    }

    @Nested
    @DisplayName("REQ-TR: 오늘 사용량 조회")
    class GetTodayUsage {

        @Test
        void 비로그인이면_예외() {
            assertThatThrownBy(() -> translationLimitService.getTodayUsage(null))
                    .isInstanceOf(UnauthorizedException.class);
        }

        @Test
        void 오늘_사용한_기록이_없으면_0건이다() {
            when(translationUsageRepository.findByUserIdAndUsageDate(1L, LocalDate.now()))
                    .thenReturn(Optional.empty());

            TranslationLimitDto.Usage result = translationLimitService.getTodayUsage(1L);

            assertThat(result.used()).isEqualTo(0);
            assertThat(result.limit()).isEqualTo(TranslationLimitService.DAILY_LIMIT);
        }

        @Test
        void 오늘_쓴_만큼_돌려준다() {
            when(translationUsageRepository.findByUserIdAndUsageDate(1L, LocalDate.now()))
                    .thenReturn(Optional.of(usage(1L, 3)));

            TranslationLimitDto.Usage result = translationLimitService.getTodayUsage(1L);

            assertThat(result.used()).isEqualTo(3);
        }
    }

    @Nested
    @DisplayName("REQ-TR: 번역 요청 전 한도 확인")
    class CheckAndIncrement {

        @Test
        void 비로그인이면_예외() {
            assertThatThrownBy(() -> translationLimitService.checkAndIncrement(null))
                    .isInstanceOf(UnauthorizedException.class);
        }

        @Test
        void 오늘_처음_요청이면_새로_만들어_1로_늘린다() {
            when(translationUsageRepository.findForUpdate(1L, LocalDate.now()))
                    .thenReturn(Optional.empty());

            translationLimitService.checkAndIncrement(1L);

            verify(translationUsageRepository).save(
                    org.mockito.ArgumentMatchers.argThat(saved -> saved.getUserId().equals(1L))
            );
        }

        @Test
        void 한도_미만이면_카운트만_늘리고_저장은_다시_하지_않는다() {
            TranslationUsage existing = usage(1L, 5);
            when(translationUsageRepository.findForUpdate(1L, LocalDate.now()))
                    .thenReturn(Optional.of(existing));

            translationLimitService.checkAndIncrement(1L);

            assertThat(existing.getCount()).isEqualTo(6);
            verify(translationUsageRepository, org.mockito.Mockito.never()).save(org.mockito.ArgumentMatchers.any());
        }

        @Test
        void 한도에_도달했으면_예외이고_더_늘지_않는다() {
            TranslationUsage existing = usage(1L, TranslationLimitService.DAILY_LIMIT);
            when(translationUsageRepository.findForUpdate(1L, LocalDate.now()))
                    .thenReturn(Optional.of(existing));

            assertThatThrownBy(() -> translationLimitService.checkAndIncrement(1L))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining(String.valueOf(TranslationLimitService.DAILY_LIMIT));

            assertThat(existing.getCount()).isEqualTo(TranslationLimitService.DAILY_LIMIT);
        }
    }
}
