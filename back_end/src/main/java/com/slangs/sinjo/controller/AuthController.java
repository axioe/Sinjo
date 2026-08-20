package com.slangs.sinjo.controller;

import com.slangs.sinjo.service.NaverService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final NaverService naverService;

    @Value("${app.naver.client-id}")
    private String clientId;

    @Value("${app.naver.redirect-uri}")
    private String redirectUri;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    /** 소셜 로그인 시작 — 네이버 인증 페이지로 보낸다 */
    @GetMapping("/naver")
    public void redirectToNaver(HttpServletResponse response) throws IOException {
        String state = UUID.randomUUID().toString();
        String url = "https://nid.naver.com/oauth2.0/authorize?response_type=code"
                + "&client_id=" + clientId
                + "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8)
                + "&state=" + state;
        response.sendRedirect(url);
    }

    /** 네이버가 사용자를 돌려보내는 곳 */
    @GetMapping("/naver/callback")
    public void callback(@RequestParam String code,
                         @RequestParam String state,
                         HttpServletResponse response) throws IOException {
        String token = naverService.naverLogin(code, state);
        response.sendRedirect(frontendUrl + "/oauth/callback?token=" + token);
    }
}