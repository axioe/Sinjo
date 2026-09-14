package com.slangs.sinjo.security;

import com.slangs.sinjo.config.SecurityConfig;
import com.slangs.sinjo.controller.AdminController;
import com.slangs.sinjo.controller.MyPageController;
import com.slangs.sinjo.dto.AdminDto;
import com.slangs.sinjo.entity.Role;
import com.slangs.sinjo.service.AdminService;
import com.slangs.sinjo.service.MyPageService;
import com.slangs.sinjo.service.WordExcelService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * SecurityConfig 의 중앙 인가 규칙을 검증한다 (REQ-ADM-01, REQ-MY-01).
 * <p>
 * AdminController/MyPageController 자체엔 권한 확인 코드가 없다 - SecurityConfig 의
 * .requestMatchers("/api/admin/**").hasRole("ADMIN") / "/api/mypage/**").hasRole("USER")
 * 한 곳에서만 막는 구조라서(CLAUDE.md 아키텍처 문서 참고), 이 경계가 실제로 지켜지는지가
 * 컨트롤러 개별 로직보다 훨씬 중요하다. 그래서 실제 SecurityConfig/JwtProvider 를
 * @Import 로 그대로 가져와 필터 체인이 진짜로 동작하는 상태에서 검증한다.
 */
@WebMvcTest(controllers = {AdminController.class, MyPageController.class})
@Import({SecurityConfig.class, JwtProvider.class})
class SecurityAuthTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtProvider jwtProvider;

    @MockitoBean
    private AdminService adminService;

    @MockitoBean
    private WordExcelService wordExcelService;

    @MockitoBean
    private MyPageService myPageService;

    private String tokenFor(Role role) {
        return jwtProvider.createToken(1L, "test@example.com", role);
    }

    @Nested
    @DisplayName("REQ-ADM-01: 관리자 API 접근 제어")
    class AdminAccess {

        @Test
        void 토큰_없이_접근하면_401() throws Exception {
            mockMvc.perform(get("/api/admin/summary"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        void 일반_회원_토큰으로_접근하면_403() throws Exception {
            mockMvc.perform(get("/api/admin/summary")
                            .header("Authorization", "Bearer " + tokenFor(Role.USER)))
                    .andExpect(status().isForbidden());
        }

        @Test
        void 관리자_토큰이면_통과한다() throws Exception {
            when(adminService.getSummary()).thenReturn(new AdminDto.Summary(0, 0, 0));

            mockMvc.perform(get("/api/admin/summary")
                            .header("Authorization", "Bearer " + tokenFor(Role.ADMIN)))
                    .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("REQ-MY-01: 마이페이지 API 접근 제어")
    class MyPageAccess {

        @Test
        void 토큰_없이_접근하면_401() throws Exception {
            mockMvc.perform(get("/api/mypage/history/count"))
                    .andExpect(status().isUnauthorized());
        }

        @Test
        void 유효한_토큰이면_통과한다() throws Exception {
            when(myPageService.getTranslationCount(1L)).thenReturn(3L);

            mockMvc.perform(get("/api/mypage/history/count")
                            .header("Authorization", "Bearer " + tokenFor(Role.USER)))
                    .andExpect(status().isOk());
        }
    }
}
