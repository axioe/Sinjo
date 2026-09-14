package com.slangs.sinjo.controller;

import com.slangs.sinjo.dto.WordAnswer;
import com.slangs.sinjo.dto.WordDto;
import com.slangs.sinjo.dto.WordSearchResponse;
import com.slangs.sinjo.service.WordIndexService;
import com.slangs.sinjo.service.WordRagService;
import com.slangs.sinjo.service.WordService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * REQ-WORD-01: 신조어 검색/랭킹/좋아요 API.
 * <p>
 * addFilters = false 로 시큐리티 필터를 끈다 - 실제로도 /api/words/** 는
 * SecurityConfig 에서 permitAll 이라(인증 규칙 자체를 검증하려면 SecurityAuthTest 참고),
 * 이 테스트는 컨트롤러가 서비스 결과를 그대로 응답에 담는지에만 집중한다.
 */
@WebMvcTest(WordController.class)
@AutoConfigureMockMvc(addFilters = false)
class WordControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private WordService wordService;

    @MockitoBean
    private WordRagService wordRagService;

    @MockitoBean
    private WordIndexService wordIndexService;

    @Nested
    @DisplayName("REQ-WORD-01: 신조어 검색")
    class Search {

        @Test
        void 검색어에_해당하는_신조어를_찾으면_200과_결과를_돌려준다() throws Exception {
            WordAnswer answer = new WordAnswer(true, "혼밥", "혼자 밥을 먹는 것", "일상", "혼밥 8단계 중 7단계");
            when(wordRagService.search(anyString(), anyString()))
                    .thenReturn(new WordSearchResponse(true, List.of(answer)));

            mockMvc.perform(get("/api/words/search").param("question", "혼밥"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.found").value(true))
                    .andExpect(jsonPath("$.wordAnswers[0].word").value("혼밥"));
        }

        @Test
        void 검색_결과가_없으면_found_false를_돌려준다() throws Exception {
            when(wordRagService.search(anyString(), anyString()))
                    .thenReturn(new WordSearchResponse(false, List.of()));

            mockMvc.perform(get("/api/words/search").param("question", "존재하지않는말"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.found").value(false));
        }
    }

    @Nested
    @DisplayName("REQ-WORD-01: 인기 신조어 랭킹")
    class Ranking {

        @Test
        void 랭킹_목록을_반환한다() throws Exception {
            when(wordService.getRankingWords()).thenReturn(List.of());

            mockMvc.perform(get("/api/words/ranking"))
                    .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("REQ-WORD-01: 좋아요")
    class Like {

        @Test
        void 좋아요_요청은_서비스로_위임된다() throws Exception {
            WordDto dto = mock(WordDto.class);
            when(wordService.likeWord(1L)).thenReturn(dto);

            mockMvc.perform(post("/api/words/1/like"))
                    .andExpect(status().isOk());

            verify(wordService).likeWord(1L);
        }
    }
}
