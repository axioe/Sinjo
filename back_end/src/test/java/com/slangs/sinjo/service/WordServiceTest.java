package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.WordDto;
import com.slangs.sinjo.entity.User;
import com.slangs.sinjo.entity.Word;
import com.slangs.sinjo.entity.WordLike;
import com.slangs.sinjo.repository.UserRepository;
import com.slangs.sinjo.repository.WordLikeRepository;
import com.slangs.sinjo.repository.WordRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * REQ-RANK-01: 인기 신조어 TOP5 랭킹(좋아요 기반).
 */
@ExtendWith(MockitoExtension.class)
class WordServiceTest {

    @Mock
    private WordRepository wordRepository;

    @Mock
    private WordLikeRepository wordLikeRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private WordService wordService;

    private Word wordWithLikes(String word, long likes) {
        Word entity = new Word(word, word + " 뜻", word + " 예문", "일상", null);
        ReflectionTestUtils.setField(entity, "likes", likes);
        return entity;
    }

    @Nested
    @DisplayName("REQ-RANK-01: 인기 신조어 랭킹 조회")
    class GetRankingWords {

        @Test
        void 저장소가_돌려준_순서대로_1위부터_순위를_매긴다() {
            when(wordRepository.findTop5ByOrderByLikesDescIdAsc()).thenReturn(List.of(
                    wordWithLikes("혼밥", 30),
                    wordWithLikes("갓생", 20),
                    wordWithLikes("킹받네", 10)
            ));

            List<WordDto> result = wordService.getRankingWords();

            assertThat(result).extracting(WordDto::getRank).containsExactly(1, 2, 3);
            assertThat(result).extracting(WordDto::getWord).containsExactly("혼밥", "갓생", "킹받네");
            assertThat(result).extracting(WordDto::getLikes).containsExactly(30L, 20L, 10L);
        }

        @Test
        void 등록된_단어가_없으면_빈_목록을_돌려준다() {
            when(wordRepository.findTop5ByOrderByLikesDescIdAsc()).thenReturn(List.of());

            List<WordDto> result = wordService.getRankingWords();

            assertThat(result).isEmpty();
        }

        @Test
        void 다섯_개_미만이면_있는_만큼만_돌려준다() {
            when(wordRepository.findTop5ByOrderByLikesDescIdAsc()).thenReturn(List.of(
                    wordWithLikes("혼밥", 5)
            ));

            List<WordDto> result = wordService.getRankingWords();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getRank()).isEqualTo(1);
        }
    }

    @Nested
    @DisplayName("REQ-RANK-01: 좋아요 중복 방지")
    class LikeWord {

        private static final Long USER_ID = 1L;
        private static final Long WORD_ID = 10L;

        @Test
        void 처음_좋아요하면_WordLike가_저장되고_likes가_증가한다() {
            User user = mock(User.class);
            Word word = wordWithLikes("혼밥", 0);

            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(wordRepository.findByIdForUpdate(WORD_ID)).thenReturn(Optional.of(word));
            when(wordLikeRepository.existsByUser_IdAndWord_Id(USER_ID, WORD_ID)).thenReturn(false);
            when(wordRepository.findById(WORD_ID)).thenReturn(Optional.of(word));

            wordService.likeWord(WORD_ID, USER_ID);

            verify(wordLikeRepository).save(any(WordLike.class));
            verify(wordRepository).increaseLike(WORD_ID);
        }

        @Test
        void 이미_좋아요한_사용자가_다시_요청하면_likes가_증가하지_않는다() {
            User user = mock(User.class);
            Word word = wordWithLikes("혼밥", 1);

            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(wordRepository.findByIdForUpdate(WORD_ID)).thenReturn(Optional.of(word));
            when(wordLikeRepository.existsByUser_IdAndWord_Id(USER_ID, WORD_ID)).thenReturn(true);
            when(wordRepository.findById(WORD_ID)).thenReturn(Optional.of(word));

            wordService.likeWord(WORD_ID, USER_ID);

            verify(wordLikeRepository, never()).save(any(WordLike.class));
            verify(wordRepository, never()).increaseLike(WORD_ID);
        }

        @Test
        void 로그인하지_않은_사용자는_예외가_발생한다() {
            org.junit.jupiter.api.Assertions.assertThrows(
                    IllegalStateException.class,
                    () -> wordService.likeWord(WORD_ID, null)
            );
        }
    }

    @Nested
    @DisplayName("REQ-RANK-01: 좋아요 취소")
    class UnlikeWord {

        private static final Long USER_ID = 1L;
        private static final Long WORD_ID = 10L;

        @Test
        void 좋아요한_상태에서_취소하면_WordLike가_삭제되고_likes가_감소한다() {
            Word word = wordWithLikes("혼밥", 1);

            when(wordRepository.findByIdForUpdate(WORD_ID)).thenReturn(Optional.of(word));
            when(wordLikeRepository.existsByUser_IdAndWord_Id(USER_ID, WORD_ID)).thenReturn(true);
            when(wordRepository.findById(WORD_ID)).thenReturn(Optional.of(word));

            wordService.unlikeWord(WORD_ID, USER_ID);

            verify(wordLikeRepository).deleteByUser_IdAndWord_Id(USER_ID, WORD_ID);
            verify(wordRepository).decreaseLike(WORD_ID);
        }

        @Test
        void 좋아요하지_않은_상태에서_취소를_요청해도_아무일도_일어나지_않는다() {
            Word word = wordWithLikes("혼밥", 0);

            when(wordRepository.findByIdForUpdate(WORD_ID)).thenReturn(Optional.of(word));
            when(wordLikeRepository.existsByUser_IdAndWord_Id(USER_ID, WORD_ID)).thenReturn(false);
            when(wordRepository.findById(WORD_ID)).thenReturn(Optional.of(word));

            wordService.unlikeWord(WORD_ID, USER_ID);

            verify(wordLikeRepository, never()).deleteByUser_IdAndWord_Id(USER_ID, WORD_ID);
            verify(wordRepository, never()).decreaseLike(WORD_ID);
        }
    }
}
