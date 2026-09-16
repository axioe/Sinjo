package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.QuizDto;
import com.slangs.sinjo.entity.QuizAttempt;
import com.slangs.sinjo.entity.QuizWord;
import com.slangs.sinjo.entity.User;
import com.slangs.sinjo.exception.UnauthorizedException;
import com.slangs.sinjo.repository.QuizAttemptRepository;
import com.slangs.sinjo.repository.QuizRepository;
import com.slangs.sinjo.repository.UserRepository;
import com.slangs.sinjo.util.KoreanUtils;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * REQ-GAME-01: 세대 간 용어 맞추기 게임 / 신조어 이해도 테스트 채점 로직.
 * REQ-GAME-03: 게임/퀴즈 결과 저장 및 통계.
 * <p>
 * QuizService.checkAnswer 는 퀴즈 종류(QuizType)에 따라 채점 기준이 다르다 - 객관식은
 * "뜻(meaning)", 초성/주관식은 "단어(word)" 와 비교한다. 이 구분이 없으면 주관식 문제
 * 지문("다음 뜻에 해당하는 신조어는?: (뜻)")에 그대로 노출된 뜻을 복사-붙여넣기만 해도
 * 정답 처리되는 구멍이 생겼던 이력이 있어(QuizService 주석 참고), 그 회귀를 막는 데
 * 초점을 둔다.
 */
@ExtendWith(MockitoExtension.class)
class QuizServiceTest {

    @Mock
    private QuizRepository quizRepository;

    @Mock
    private QuizAttemptRepository quizAttemptRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PointService pointService;

    @InjectMocks
    private QuizService quizService;

    private QuizWord quizWord(String word, String answer) {
        QuizWord quiz = new QuizWord(word, answer, List.of(), "힌트", null);
        ReflectionTestUtils.setField(quiz, "id", 1L);
        return quiz;
    }

    private QuizWord quizWord(long id, String word, String answer, List<String> options, String description) {
        QuizWord quiz = new QuizWord(word, answer, options, description, null);
        ReflectionTestUtils.setField(quiz, "id", id);
        return quiz;
    }

    @Nested
    @DisplayName("REQ-GAME-01: 퀴즈 문제 조회")
    class QuizRetrieval {

        @Test
        void 객관식_보기에_정답이_없으면_보기_목록에_정답을_추가한다() {
            QuizWord quiz = quizWord(1L, "혼밥", "혼자 밥을 먹는 것",
                    List.of("함께 밥을 먹는 것", "밥을 거르는 것"), "힌트");
            when(quizRepository.findAllIds()).thenReturn(List.of(1L));
            when(quizRepository.findAllById(any())).thenReturn(List.of(quiz));

            List<QuizDto.MultipleChoice> result = quizService.getMultipleChoiceQuizzes();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).options())
                    .containsExactlyInAnyOrder("함께 밥을 먹는 것", "밥을 거르는 것", "혼자 밥을 먹는 것");
        }

        @Test
        void 객관식_보기에_정답이_이미_있으면_중복으로_추가하지_않는다() {
            // DB options 에 공백/대소문자만 다른 정답이 이미 들어 있는 경우 -
            // normalize 비교로 중복 추가를 막는지 확인한다.
            QuizWord quiz = quizWord(1L, "혼밥", "혼자 밥을 먹는 것",
                    List.of(" 혼자 밥을 먹는 것 ", "밥을 거르는 것"), "힌트");
            when(quizRepository.findAllIds()).thenReturn(List.of(1L));
            when(quizRepository.findAllById(any())).thenReturn(List.of(quiz));

            List<QuizDto.MultipleChoice> result = quizService.getMultipleChoiceQuizzes();

            assertThat(result.get(0).options()).hasSize(2);
        }

        @Test
        void 초성_퀴즈는_단어의_초성과_힌트를_돌려준다() {
            QuizWord quiz = quizWord(1L, "혼밥", "혼자 밥을 먹는 것", List.of(), "설명입니다");
            when(quizRepository.findAllIds()).thenReturn(List.of(1L));
            when(quizRepository.findAllById(any())).thenReturn(List.of(quiz));

            List<QuizDto.InitialSound> result = quizService.getInitialSoundQuizzes();

            assertThat(result.get(0).initialSound()).isEqualTo(KoreanUtils.extractInitialSound("혼밥"));
            assertThat(result.get(0).hint()).isEqualTo("설명입니다");
        }

        @Test
        void 초성_퀴즈는_설명이_없으면_뜻을_힌트로_쓴다() {
            QuizWord quiz = quizWord(1L, "혼밥", "혼자 밥을 먹는 것", List.of(), "  ");
            when(quizRepository.findAllIds()).thenReturn(List.of(1L));
            when(quizRepository.findAllById(any())).thenReturn(List.of(quiz));

            List<QuizDto.InitialSound> result = quizService.getInitialSoundQuizzes();

            assertThat(result.get(0).hint()).isEqualTo("혼자 밥을 먹는 것");
        }

        @Test
        void 주관식_퀴즈는_뜻을_지문에_담고_설명을_그대로_돌려준다() {
            QuizWord quiz = quizWord(1L, "혼밥", "혼자 밥을 먹는 것", List.of(), "설명입니다");
            when(quizRepository.findAllIds()).thenReturn(List.of(1L));
            when(quizRepository.findAllById(any())).thenReturn(List.of(quiz));

            List<QuizDto.Subjective> result = quizService.getSubjectiveQuizzes();

            assertThat(result.get(0).question()).isEqualTo("다음 뜻에 해당하는 신조어는?: 혼자 밥을 먹는 것");
            assertThat(result.get(0).description()).isEqualTo("설명입니다");
        }

        @Test
        void 등록된_문제가_요청_개수보다_적으면_있는_만큼만_돌려준다() {
            when(quizRepository.findAllIds()).thenReturn(List.of(1L, 2L, 3L));
            when(quizRepository.findAllById(any())).thenReturn(List.of(
                    quizWord(1L, "혼밥", "혼자 밥을 먹는 것", List.of(), "힌트1"),
                    quizWord(2L, "갓생", "부지런한 삶", List.of(), "힌트2"),
                    quizWord(3L, "킹받네", "매우 화나네", List.of(), "힌트3")
            ));

            List<QuizDto.Subjective> result = quizService.getSubjectiveQuizzes();

            assertThat(result).hasSize(3);
        }
    }

    @Nested
    @DisplayName("REQ-GAME-01: 객관식 채점")
    class MultipleChoice {

        @Test
        void 뜻을_고르면_정답() {
            QuizWord quiz = quizWord("억까", "억지로 비판받는 상황");
            when(quizRepository.findById(1L)).thenReturn(Optional.of(quiz));

            QuizDto.CheckResponse response = quizService.checkAnswer(
                    new QuizDto.CheckRequest(1L, "억지로 비판받는 상황", QuizDto.QuizType.MULTIPLE_CHOICE));

            assertThat(response.correct()).isTrue();
            assertThat(response.correctAnswer()).isEqualTo("억지로 비판받는 상황");
        }

        @Test
        void 신조어_단어를_적으면_오답() {
            // 객관식은 "뜻"을 골라야 하는 문제라, 단어(정답 신조어) 자체를 적으면
            // 오답이어야 한다 - 채점 기준이 뒤섞이지 않았는지 확인한다.
            QuizWord quiz = quizWord("억까", "억지로 비판받는 상황");
            when(quizRepository.findById(1L)).thenReturn(Optional.of(quiz));

            QuizDto.CheckResponse response = quizService.checkAnswer(
                    new QuizDto.CheckRequest(1L, "억까", QuizDto.QuizType.MULTIPLE_CHOICE));

            assertThat(response.correct()).isFalse();
        }
    }

    @Nested
    @DisplayName("REQ-GAME-01: 초성/주관식 채점")
    class SubjectiveAndInitialSound {

        @Test
        void 초성_퀴즈는_단어를_맞혀야_정답() {
            QuizWord quiz = quizWord("갓생", "부지런하고 계획적인 삶");
            when(quizRepository.findById(1L)).thenReturn(Optional.of(quiz));

            QuizDto.CheckResponse response = quizService.checkAnswer(
                    new QuizDto.CheckRequest(1L, "갓생", QuizDto.QuizType.INITIAL_SOUND));

            assertThat(response.correct()).isTrue();
            assertThat(response.correctAnswer()).isEqualTo("갓생");
        }

        @Test
        void 주관식_문제_지문에_노출된_뜻을_그대로_적으면_오답() {
            // 회귀 방지: 주관식 지문은 "다음 뜻에 해당하는 신조어는?: (뜻)" 형태로 뜻을
            // 그대로 노출한다. 예전엔 이 지문을 복사-붙여넣기만 해도 정답 처리되는
            // 버그가 있었다 - 지금은 "단어" 와 비교해야 한다.
            QuizWord quiz = quizWord("갓생", "부지런하고 계획적인 삶");
            when(quizRepository.findById(1L)).thenReturn(Optional.of(quiz));

            QuizDto.CheckResponse response = quizService.checkAnswer(
                    new QuizDto.CheckRequest(1L, "부지런하고 계획적인 삶", QuizDto.QuizType.SUBJECTIVE));

            assertThat(response.correct()).isFalse();
            assertThat(response.correctAnswer()).isEqualTo("갓생");
        }

        @Test
        void 공백_차이는_무시하고_정답_처리() {
            QuizWord quiz = quizWord("혼밥", "혼자 밥을 먹는 것");
            when(quizRepository.findById(1L)).thenReturn(Optional.of(quiz));

            QuizDto.CheckResponse response = quizService.checkAnswer(
                    new QuizDto.CheckRequest(1L, " 혼 밥 ", QuizDto.QuizType.SUBJECTIVE));

            assertThat(response.correct()).isTrue();
        }
    }

    @Nested
    @DisplayName("REQ-GAME-01: 예외 상황")
    class ErrorCases {

        @Test
        void quizId가_없으면_예외() {
            assertThatThrownBy(() ->
                    quizService.checkAnswer(new QuizDto.CheckRequest(null, "아무거나", QuizDto.QuizType.MULTIPLE_CHOICE)))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        void 존재하지_않는_퀴즈면_예외() {
            when(quizRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() ->
                    quizService.checkAnswer(new QuizDto.CheckRequest(999L, "아무거나", QuizDto.QuizType.MULTIPLE_CHOICE)))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Nested
    @DisplayName("REQ-GAME-03: 게임 결과 저장")
    class SaveAttempt {

        @Test
        void 비로그인이면_저장하지_않는다() {
            quizService.saveAttempt(null, new QuizDto.AttemptRequest(QuizDto.QuizType.MULTIPLE_CHOICE, 3, 5));

            verifyNoInteractions(quizAttemptRepository, pointService);
        }

        @Test
        void 로그인_사용자는_결과가_저장되고_점수만큼_포인트가_적립된다() {
            when(userRepository.getReferenceById(1L)).thenReturn(new User());

            quizService.saveAttempt(1L, new QuizDto.AttemptRequest(QuizDto.QuizType.MULTIPLE_CHOICE, 3, 5));

            ArgumentCaptor<QuizAttempt> captor = ArgumentCaptor.forClass(QuizAttempt.class);
            verify(quizAttemptRepository).save(captor.capture());
            assertThat(captor.getValue().getScore()).isEqualTo(3);
            assertThat(captor.getValue().getTotal()).isEqualTo(5);
            verify(pointService).earn(1L, 30, "게임 플레이");
        }
    }

    @Nested
    @DisplayName("REQ-GAME-03: 마이페이지 게임 통계")
    class MyStats {

        @Test
        void 비로그인이면_예외() {
            assertThatThrownBy(() -> quizService.getMyStats(null))
                    .isInstanceOf(UnauthorizedException.class);
        }

        @Test
        void 전체_플레이_횟수와_이번_달_횟수를_돌려준다() {
            when(quizAttemptRepository.countByUserId(1L)).thenReturn(12L);
            when(quizAttemptRepository.countByUserIdAndCreatedAtAfter(org.mockito.ArgumentMatchers.eq(1L), any(LocalDateTime.class)))
                    .thenReturn(4L);

            QuizDto.MyStats stats = quizService.getMyStats(1L);

            assertThat(stats.totalPlays()).isEqualTo(12L);
            assertThat(stats.playsThisMonth()).isEqualTo(4L);
        }
    }
}
