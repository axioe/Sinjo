package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.WordDto;
import com.slangs.sinjo.entity.Word;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

/**
 * REQ-RANK-01: 인기 신조어 TOP5 랭킹(좋아요 기반).
 */
@ExtendWith(MockitoExtension.class)
class WordServiceTest {

    @Mock
    private WordRepository wordRepository;

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
}
