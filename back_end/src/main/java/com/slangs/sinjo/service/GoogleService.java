package com.slangs.sinjo.service;

import com.slangs.sinjo.entity.Provider;
import com.slangs.sinjo.entity.Role;
import com.slangs.sinjo.entity.User;
import com.slangs.sinjo.repository.UserRepository;
import com.slangs.sinjo.security.JwtProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GoogleService {

    private final UserRepository userRepository;
    private final JwtProvider jwtProvider;
    private final RestClient restClient = RestClient.create();

    @Value("${app.google.client-id}")
    private String clientId;

    @Value("${app.google.client-secret}")
    private String clientSecret;

    @Value("${app.google.redirect-uri}")
    private String redirectUri;

    @Transactional
    public String googleLogin(String code) {
        String accessToken = getAccessToken(code);
        Map<String, Object> profile = getUserInfo(accessToken);
        User user = findOrCreate(profile);
        return jwtProvider.createToken(user.getId(), user.getEmail(), user.getRole());
    }

    private String getAccessToken(String code) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "authorization_code");
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);
        form.add("redirect_uri", redirectUri);
        form.add("code", code);

        Map<String, Object> res = restClient.post()
                .uri("https://oauth2.googleapis.com/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .body(Map.class);

        return (String) res.get("access_token");
    }

    private Map<String, Object> getUserInfo(String accessToken) {
        return restClient.get()
                .uri("https://www.googleapis.com/oauth2/v2/userinfo")
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .body(Map.class);
    }

    private User findOrCreate(Map<String, Object> profile) {
        String providerId = (String) profile.get("id");
        String email = (String) profile.get("email");
        String name = (String) profile.get("name");

        return userRepository.findByProviderAndProviderId(Provider.GOOGLE, providerId)
                .orElseGet(() -> {
                    User user = new User();
                    user.setEmail(email);
                    user.setPassword(UUID.randomUUID().toString());
                    user.setNickname(name != null ? name : "구글사용자");
                    user.setProvider(Provider.GOOGLE);
                    user.setProviderId(providerId);
                    user.setRole(Role.USER);
                    return userRepository.save(user);
                });
    }
}