package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.QuizQuestion;
import com.slangs.sinjo.dto.QuizResponse;
import com.slangs.sinjo.entity.LearningHistory;
import com.slangs.sinjo.entity.Word;
import com.slangs.sinjo.repository.LearningHistoryRepository;
import com.slangs.sinjo.repository.WordRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * REQ-CHAT-02: 오늘의 신조어 5개 학습/완료 처리.
 */
@ExtendWith(MockitoExtension.class)
class AiLearningServiceTest {

    @Mock
    private WordRepository wordRepository;

    @Mock
    private LearningHistoryRepository learningHistoryRepository;

    @InjectMocks
    private AiLearningService aiLearningService;

    private List<Word> words(int count) {
        return java.util.stream.IntStream.range(0, count)
                .mapToObj(i -> {
                    Word word = new Word("단어" + i, "뜻" + i, "예문" + i, "일상", null);
                    org.springframework.test.util.ReflectionTestUtils.setField(word, "id", (long) i);
                    return word;
                })
                .toList();
    }

    @Nested
    @DisplayName("REQ-CHAT-02: 오늘의 학습 문제 생성")
    class CreateTodayQuiz {

        @Test
        void 단어가_보기_개수보다_적으면_빈_문제를_돌려준다() {
            when(wordRepository.findAll()).thenReturn(words(3)); // OPTION_SIZE(4) 미만

            QuizResponse response = aiLearningService.createTodayQuiz(1L);

            assertThat(response.questions()).isEmpty();
        }

        @Test
        void 비로그인_사용자는_학습_이력과_무관하게_문제를_받는다() {
            when(wordRepository.findAll()).thenReturn(words(10));

            QuizResponse response = aiLearningService.createTodayQuiz(null);

            assertThat(response.questions()).hasSize(5);
            verify(learningHistoryRepository, never()).findByUserId(any());
        }

        @Test
        void 이미_학습한_단어는_문제에서_제외된다() {
            when(wordRepository.findAll()).thenReturn(words(6));
            // 0~4번 단어를 이미 학습함 - 5번 단어 하나만 남는다.
            List<LearningHistory> learned = java.util.stream.LongStream.range(0, 5)
                    .mapToObj(id -> new LearningHistory(1L, id))
                    .toList();
            when(learningHistoryRepository.findByUserId(1L)).thenReturn(learned);

            QuizResponse response = aiLearningService.createTodayQuiz(1L);

            assertThat(response.questions()).hasSize(1);
            assertThat(response.questions().get(0).word()).isEqualTo("단어5");
        }

        @Test
        void 모든_단어를_학습했으면_이력을_초기화하고_새로_시작한다() {
            when(wordRepository.findAll()).thenReturn(words(6));
            List<LearningHistory> learnedAll = java.util.stream.LongStream.range(0, 6)
                    .mapToObj(id -> new LearningHistory(1L, id))
                    .toList();
            when(learningHistoryRepository.findByUserId(1L)).thenReturn(learnedAll);

            QuizResponse response = aiLearningService.createTodayQuiz(1L);

            verify(learningHistoryRepository).deleteByUserId(1L);
            assertThat(response.questions()).hasSize(5);
        }

        @Test
        void 문제마다_보기가_4개이고_정답_위치가_유효하다() {
            when(wordRepository.findAll()).thenReturn(words(10));

            QuizResponse response = aiLearningService.createTodayQuiz(null);

            for (QuizQuestion question : response.questions()) {
                assertThat(question.options()).hasSize(4);
                assertThat(question.answer()).isBetween(0, 3);
                assertThat(question.options().get(question.answer()))
                        .isNotBlank();
            }
        }
    }

    @Nested
    @DisplayName("REQ-CHAT-02: 학습 완료 처리")
    class CompleteLearning {

        @Test
        void 단어_목록이_비어있으면_아무_일도_하지_않는다() {
            aiLearningService.completeLearning(1L, List.of());

            verify(learningHistoryRepository, never()).save(any());
        }

        @Test
        void 이미_기록된_단어는_중복_저장하지_않는다() {
            when(learningHistoryRepository.existsByUserIdAndWordId(1L, 10L)).thenReturn(true);

            aiLearningService.completeLearning(1L, List.of(10L));

            verify(learningHistoryRepository, never()).save(any());
        }

        @Test
        void 새로운_단어는_학습_이력으로_저장된다() {
            when(learningHistoryRepository.existsByUserIdAndWordId(1L, 10L)).thenReturn(false);

            aiLearningService.completeLearning(1L, List.of(10L));

            verify(learningHistoryRepository).save(any(LearningHistory.class));
        }
    }
}
