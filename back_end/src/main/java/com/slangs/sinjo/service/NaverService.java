package com.slangs.sinjo.service;

import com.slangs.sinjo.entity.Provider;
import com.slangs.sinjo.entity.Role;
import com.slangs.sinjo.entity.User;
import com.slangs.sinjo.repository.UserRepository;
import com.slangs.sinjo.security.JwtProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NaverService {

    private final UserRepository userRepository;
    private final JwtProvider jwtProvider;
    private final RestClient restClient = RestClient.create();

    @Value("${app.naver.client-id}")
    private String clientId;

    @Value("${app.naver.client-secret}")
    private String clientSecret;

    @Transactional
    public String naverLogin(String code, String state) {
        String accessToken = getAccessToken(code, state);
        Map<String, Object> profile = getUserInfo(accessToken);
        User user = findOrCreate(profile);
        return jwtProvider.createToken(user.getId(), user.getEmail(), user.getRole());
    }

    private String getAccessToken(String code, String state) {
        Map<String, Object> res = restClient.get()
                .uri("https://nid.naver.com/oauth2.0/token?grant_type=authorization_code"
                        + "&client_id=" + clientId
                        + "&client_secret=" + clientSecret
                        + "&code=" + code
                        + "&state=" + state)
                .retrieve()
                .body(Map.class);
        return (String) res.get("access_token");
    }

    private Map<String, Object> getUserInfo(String accessToken) {
        Map<String, Object> res = restClient.get()
                .uri("https://openapi.naver.com/v1/nid/me")
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .body(Map.class);
        return (Map<String, Object>) res.get("response");
    }

    private User findOrCreate(Map<String, Object> profile) {
        String providerId = (String) profile.get("id");
        String email = (String) profile.get("email");
        String nickname = (String) profile.get("nickname");

        return userRepository.findByProviderAndProviderId(Provider.NAVER, providerId)
                .orElseGet(() -> {
                    User user = new User();
                    user.setEmail(email);
                    user.setPassword(UUID.randomUUID().toString());
                    user.setNickname(nickname != null ? nickname : "네이버사용자");
                    user.setProvider(Provider.NAVER);
                    user.setProviderId(providerId);
                    user.setRole(Role.USER);
                    return userRepository.save(user);
                });
    }
}