package com.slangs.sinjo.controller;

import com.slangs.sinjo.dto.WordAnswer;
import com.slangs.sinjo.dto.WordDto;
import com.slangs.sinjo.dto.WordSearchResponse;
import com.slangs.sinjo.service.WordIndexService;
import com.slangs.sinjo.service.WordRagService;
import com.slangs.sinjo.service.WordService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * REQ-WORD-01: 신조어 검색/랭킹/좋아요 API.
 * <p>
 * addFilters = false 로 시큐리티 필터를 끈다 - 검색/랭킹/조회는 SecurityConfig 에서
 * permitAll 이지만 좋아요(/{id}/like)는 인증이 필요하다(인증 규칙 자체를 검증하려면
 * SecurityAuthTest 참고). 필터가 꺼져 있어도 @AuthenticationPrincipal 은
 * SecurityContext 에서 직접 읽으므로, 좋아요 테스트는 authentication() 으로
 * JwtAuthenticationFilter 가 실제로 채워 넣는 것과 같은 형태의 Authentication
 * (principal = 사용자 id)을 주입한다.
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

        /*
         * addFilters = false 는 SecurityContextPersistenceFilter 를 포함한 필터 체인
         * 전체를 끈다. SecurityMockMvcRequestPostProcessors.authentication() 은 원래
         * 그 필터가 세션에서 SecurityContext 를 읽어 SecurityContextHolder 에 실어주는
         * 것에 기대는 방식이라, 필터가 꺼진 상태에서는 @AuthenticationPrincipal 이
         * 계속 null 로 들어온다. 그래서 여기서는 MockMvc 가 같은 스레드에서 동기 실행되는
         * 점을 이용해 SecurityContextHolder 에 직접 인증 정보를 넣는다.
         */
        @AfterEach
        void clearSecurityContext() {
            SecurityContextHolder.clearContext();
        }

        private void loginAs(Long userId) {
            Authentication auth = new UsernamePasswordAuthenticationToken(
                    userId,
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_USER"))
            );
            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        @Test
        void 좋아요_요청은_로그인_사용자_id와_함께_서비스로_위임된다() throws Exception {
            loginAs(10L);
            WordDto dto = mock(WordDto.class);
            when(wordService.likeWord(1L, 10L)).thenReturn(dto);

            mockMvc.perform(post("/api/words/1/like"))
                    .andExpect(status().isOk());

            verify(wordService).likeWord(1L, 10L);
        }

        @Test
        void 좋아요_취소_요청은_로그인_사용자_id와_함께_서비스로_위임된다() throws Exception {
            loginAs(10L);
            WordDto dto = mock(WordDto.class);
            when(wordService.unlikeWord(1L, 10L)).thenReturn(dto);

            mockMvc.perform(delete("/api/words/1/like"))
                    .andExpect(status().isOk());

            verify(wordService).unlikeWord(1L, 10L);
        }
    }
}
