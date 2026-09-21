package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.DailyActivityDto;
import com.slangs.sinjo.dto.FavoritesDto;
import com.slangs.sinjo.dto.QuizAttemptDto;
import com.slangs.sinjo.dto.QuizDto;
import com.slangs.sinjo.dto.TranslationDto;
import com.slangs.sinjo.dto.TranslationLimitDto;
import com.slangs.sinjo.entity.QuizAttempt;
import com.slangs.sinjo.entity.TranslationMode;
import com.slangs.sinjo.entity.Translations;
import com.slangs.sinjo.exception.UnauthorizedException;
import com.slangs.sinjo.repository.FavoritesRepository;
import com.slangs.sinjo.repository.QuizAttemptRepository;
import com.slangs.sinjo.repository.TranslationsRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * REQ-MYPAGE-01(변역 이력 조회), REQ-MYPAGE-02(즐겨찾기 조회/추가/삭제),
 * REQ-MYPAGE-03(게임/퀴즈 결과 조회 - 전용 화면 및 달력 상세).
 */
@ExtendWith(MockitoExtension.class)
class MyPageServiceTest {

    @Mock
    private TranslationsRepository translationsRepository;

    @Mock
    private FavoritesRepository favoritesRepository;

    @Mock
    private QuizAttemptRepository quizAttemptRepository;

    @Mock
    private PointService pointService;

    @Mock
    private TranslationLimitService translationLimitService;

    @InjectMocks
    private MyPageService myPageService;

    @Nested
    @DisplayName("REQ-MYPAGE-01: 번역 이력 조회")
    class History {

        @Test
        void 페이지네이션으로_이력을_조회한다() {
            Translations t = Translations.builder()
                    .userId(1L)
                    .mode(TranslationMode.EXPLAIN)
                    .originalText("억까")
                    .translatedText("억지로 비판받는 상황")
                    .explanation("예문")
                    .build();
            Page<Translations> page = new PageImpl<>(List.of(t));
            when(translationsRepository.findByUserIdOrderByCreatedAtDesc(eq(1L), any(PageRequest.class)))
                    .thenReturn(page);

            List<TranslationDto> result = myPageService.getHistory(1L, 0, 5);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).originalText()).isEqualTo("억까");
            assertThat(result.get(0).translatedText()).isEqualTo("억지로 비판받는 상황");
        }

        @Test
        void 저장한_번역_개수를_돌려준다() {
            when(translationsRepository.countByUserId(1L)).thenReturn(7L);

            assertThat(myPageService.getTranslationCount(1L)).isEqualTo(7L);
        }

        @Test
        void 오늘의_번역_사용량은_TranslationLimitService에_위임된다() {
            TranslationLimitDto.Usage usage = new TranslationLimitDto.Usage(3, 10);
            when(translationLimitService.getTodayUsage(1L)).thenReturn(usage);

            assertThat(myPageService.getTodayTranslationUsage(1L)).isEqualTo(usage);
        }
    }

    @Nested
    @DisplayName("REQ-MYPAGE-02: 즐겨찾기 조회")
    class FavoritesRead {

        @Test
        void 즐겨찾기_목록을_조회한다() {
            FavoritesDto dto = new FavoritesDto(1L, 10L, "갓생", "부지런한 삶", "일상", LocalDateTime.now());
            Page<FavoritesDto> page = new PageImpl<>(List.of(dto));
            when(favoritesRepository.findFavorites(eq(1L), any(PageRequest.class))).thenReturn(page);

            List<FavoritesDto> result = myPageService.getFavorites(1L, 0, 5);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).word()).isEqualTo("갓생");
        }

        @Test
        void 즐겨찾기_개수를_돌려준다() {
            when(favoritesRepository.countByUserId(1L)).thenReturn(3L);

            assertThat(myPageService.getFavoriteCount(1L)).isEqualTo(3L);
        }
    }

    @Nested
    @DisplayName("REQ-MYPAGE-02: 즐겨찾기 추가")
    class FavoritesAdd {

        @Test
        void 비로그인이면_아무_일도_하지_않는다() {
            myPageService.addFavorite(null, 10L);

            verify(favoritesRepository, never()).save(any());
        }

        @Test
        void 이미_등록된_단어면_중복_저장하지_않는다() {
            when(favoritesRepository.existsByUserIdAndWordId(1L, 10L)).thenReturn(true);

            myPageService.addFavorite(1L, 10L);

            verify(favoritesRepository, never()).save(any());
        }

        @Test
        void 처음_등록하는_단어는_저장된다() {
            when(favoritesRepository.existsByUserIdAndWordId(1L, 10L)).thenReturn(false);

            myPageService.addFavorite(1L, 10L);

            verify(favoritesRepository).save(any());
        }
    }

    @Nested
    @DisplayName("REQ-MYPAGE-02: 즐겨찾기 삭제")
    class FavoritesRemove {

        @Test
        void 비로그인이면_아무_일도_하지_않는다() {
            myPageService.removeFavorite(null, 10L);

            verify(favoritesRepository, never()).deleteByUserIdAndWordId(any(), any());
        }

        @Test
        void 로그인_사용자는_삭제_요청이_그대로_위임된다() {
            myPageService.removeFavorite(1L, 10L);

            verify(favoritesRepository).deleteByUserIdAndWordId(1L, 10L);
        }
    }

    @Nested
    @DisplayName("REQ-MYPAGE-03: 게임 기록 조회")
    class GameHistory {

        @Test
        void 페이지네이션으로_게임_기록을_조회한다() {
            QuizAttempt attempt = new QuizAttempt(null, QuizDto.QuizType.MULTIPLE_CHOICE, 3, 5);
            ReflectionTestUtils.setField(attempt, "id", 1L);
            Page<QuizAttempt> page = new PageImpl<>(List.of(attempt));
            when(quizAttemptRepository.findByUserIdOrderByCreatedAtDesc(eq(1L), any(PageRequest.class)))
                    .thenReturn(page);

            List<QuizAttemptDto> result = myPageService.getGameHistory(1L, 0, 5);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).score()).isEqualTo(3);
            assertThat(result.get(0).total()).isEqualTo(5);
            assertThat(result.get(0).quizType()).isEqualTo("MULTIPLE_CHOICE");
        }
    }

    @Nested
    @DisplayName("REQ-MYPAGE-03: 활동 통계 달력 상세")
    class DailyActivity {

        @Test
        void 비로그인이면_예외() {
            assertThatThrownBy(() -> myPageService.getDailyActivity(null, LocalDate.now()))
                    .isInstanceOf(UnauthorizedException.class);
        }

        @Test
        void 번역과_퀴즈_기록을_시각순으로_합쳐_돌려준다() {
            LocalDate date = LocalDate.of(2026, 9, 16);

            Translations translation = Translations.builder()
                    .userId(1L)
                    .mode(TranslationMode.EXPLAIN)
                    .originalText("억까")
                    .translatedText("억지로 비판받는 상황")
                    .explanation("예문")
                    .build();
            ReflectionTestUtils.setField(translation, "createdAt", date.atTime(10, 0));

            QuizAttempt attempt = new QuizAttempt(null, QuizDto.QuizType.MULTIPLE_CHOICE, 3, 5);
            ReflectionTestUtils.setField(attempt, "createdAt", date.atTime(9, 0));

            when(translationsRepository.findByUserIdAndCreatedAtBetween(
                    eq(1L), eq(date.atStartOfDay()), eq(date.atStartOfDay().plusDays(1))))
                    .thenReturn(List.of(translation));
            when(quizAttemptRepository.findByUserIdAndCreatedAtBetween(
                    eq(1L), eq(date.atStartOfDay()), eq(date.atStartOfDay().plusDays(1))))
                    .thenReturn(List.of(attempt));

            DailyActivityDto.Response response = myPageService.getDailyActivity(1L, date);

            assertThat(response.items()).hasSize(2);
            // 09:00 퀴즈 기록이 10:00 번역 기록보다 먼저 와야 한다(시각순 정렬).
            assertThat(response.items().get(0).type()).isEqualTo("QUIZ");
            assertThat(response.items().get(0).detail()).isEqualTo("3/5문제 정답");
            assertThat(response.items().get(1).type()).isEqualTo("TRANSLATION");
            assertThat(response.items().get(1).title()).isEqualTo("억까");
        }

        @Test
        void 해당_날짜에_기록이_없으면_빈_목록을_돌려준다() {
            LocalDate date = LocalDate.of(2026, 9, 16);
            when(translationsRepository.findByUserIdAndCreatedAtBetween(any(), any(), any()))
                    .thenReturn(List.of());
            when(quizAttemptRepository.findByUserIdAndCreatedAtBetween(any(), any(), any()))
                    .thenReturn(List.of());

            DailyActivityDto.Response response = myPageService.getDailyActivity(1L, date);

            assertThat(response.items()).isEmpty();
        }
    }
}
