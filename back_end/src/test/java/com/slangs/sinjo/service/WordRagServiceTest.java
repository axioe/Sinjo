package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.WordAnswer;
import com.slangs.sinjo.entity.Word;
import com.slangs.sinjo.repository.WordRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.document.Document;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * REQ-TR-02(LLM 해설 엔진 - 컨텍스트 기반 응답), REQ-CHAT-01(플로팅 AI 챗봇 질의응답).
 * <p>
 * 두 요구사항 모두 결국 WordRagService.ask() 하나로 구현되어 있다 - 챗봇 질문/답변 흐름과
 * "번역 해설"에 쓰이는 LLM 파이프라인이 같은 코드다. ChatClient 를 직접 모킹하는 대신
 * WordSearchService/WordAnswerService 협력자를 모킹해서, 벡터 검색 결과 유무 및 DB 매칭
 * 여부에 따라 어떤 답변 경로를 타는지(할루시네이션 방지 분기)를 검증한다.
 */
@ExtendWith(MockitoExtension.class)
class WordRagServiceTest {

    @Mock private WordRepository wordRepository;
    @Mock private WordSearchService searchService;
    @Mock private WordAnswerService answerService;

    @InjectMocks
    private WordRagService wordRagService;

    private Document documentWithWordId(String wordId) {
        return Document.builder()
                .text("word: 혼밥")
                .metadata(wordId == null ? Map.of() : Map.of("wordId", wordId))
                .build();
    }

    @Nested
    @DisplayName("REQ-TR-02/REQ-CHAT-01: 검색 결과 없음")
    class NoVectorResult {

        @Test
        void 벡터_검색_결과가_없으면_컨텍스트_없이_답변한다() {
            when(searchService.search("아무말", 3)).thenReturn(List.of());
            when(answerService.answerWithoutContext("아무말"))
                    .thenReturn(new WordAnswer(false, null, null, null, "잘 모르겠어요"));

            WordAnswer result = wordRagService.ask("아무말", null);

            assertThat(result.found()).isFalse();
            verify(answerService, never()).answer(anyString(), any(), any());
        }
    }

    @Nested
    @DisplayName("REQ-TR-02/REQ-CHAT-01: 벡터 검색은 됐지만 DB에 없음")
    class VectorFoundButDbMissing {

        @Test
        void wordId가_없으면_컨텍스트_없이_답변한다() {
            when(searchService.search("혼밥", 3)).thenReturn(List.of(documentWithWordId(null)));
            when(answerService.answerWithoutContext("혼밥"))
                    .thenReturn(new WordAnswer(false, null, null, null, "확인이 필요해요"));

            WordAnswer result = wordRagService.ask("혼밥", null);

            assertThat(result.found()).isFalse();
        }

        @Test
        void wordId는_있지만_DB에서_삭제된_단어면_컨텍스트_없이_답변한다() {
            when(searchService.search("혼밥", 3)).thenReturn(List.of(documentWithWordId("999")));
            when(wordRepository.findById(999L)).thenReturn(Optional.empty());
            when(answerService.answerWithoutContext("혼밥"))
                    .thenReturn(new WordAnswer(false, null, null, null, "확인이 필요해요"));

            WordAnswer result = wordRagService.ask("혼밥", null);

            assertThat(result.found()).isFalse();
            verify(answerService, never()).answer(anyString(), any(), any());
        }
    }

    @Nested
    @DisplayName("REQ-TR-02/REQ-CHAT-01: 벡터 검색 + DB 매칭 성공")
    class VectorAndDbFound {

        @Test
        void DB_정보를_컨텍스트로_담아_답변한다() {
            Word word = new Word("혼밥", "혼자 밥을 먹는 것", "혼밥 8단계", "일상", null);
            when(searchService.search("혼밥이 뭐야", 3)).thenReturn(List.of(documentWithWordId("1")));
            when(wordRepository.findById(1L)).thenReturn(Optional.of(word));
            when(answerService.answer(eq("혼밥이 뭐야"), any(), eq(word)))
                    .thenReturn(new WordAnswer(true, "혼밥", "혼자 밥을 먹는 것", "일상", "혼자 밥 먹는다는 뜻이에요"));

            WordAnswer result = wordRagService.ask("혼밥이 뭐야", null);

            assertThat(result.found()).isTrue();
            assertThat(result.word()).isEqualTo("혼밥");
            verify(answerService, never()).answerWithoutContext(anyString());
        }

        @Test
        void 카테고리가_지정되면_카테고리_검색을_쓴다() {
            Word word = new Word("혼밥", "혼자 밥을 먹는 것", "혼밥 8단계", "일상", null);
            when(searchService.searchByCategory("혼밥이 뭐야", "일상", 3)).thenReturn(List.of(documentWithWordId("1")));
            when(wordRepository.findById(1L)).thenReturn(Optional.of(word));
            when(answerService.answer(anyString(), any(), eq(word)))
                    .thenReturn(new WordAnswer(true, "혼밥", "혼자 밥을 먹는 것", "일상", "답변"));

            wordRagService.ask("혼밥이 뭐야", "일상");

            verify(searchService).searchByCategory("혼밥이 뭐야", "일상", 3);
            verify(searchService, never()).search(anyString(), org.mockito.ArgumentMatchers.anyInt());
        }
    }
}
