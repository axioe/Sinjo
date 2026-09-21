package com.slangs.sinjo.config;

import com.slangs.sinjo.security.JwtAuthenticationFilter;
import com.slangs.sinjo.security.JwtProvider;
import jakarta.servlet.DispatcherType;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtProvider jwtProvider;

    @Value("${app.cors.allowed-origins}")
    private List<String> allowedOrigins;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http
    ) throws Exception {

        http
                .cors(cors ->
                        cors.configurationSource(
                                corsConfigurationSource()
                        )
                )

                .csrf(csrf ->
                        csrf.disable()
                )

                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )

                .authorizeHttpRequests(auth -> auth

                        .dispatcherTypeMatchers(
                                DispatcherType.FORWARD,
                                DispatcherType.ERROR
                        ).permitAll()

                        /*
                         * 관리자 API
                         */
                        .requestMatchers(
                                "/api/admin/**"
                        ).hasRole("ADMIN")

                        /*
                         * 마이페이지
                         */
                        .requestMatchers(
                                "/api/mypage/**"
                        ).hasAnyRole(
                                "USER",
                                "ADMIN"
                        )

                        /*
                         * 좋아요 목록
                         */
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/words/liked"
                        ).hasAnyRole(
                                "USER",
                                "ADMIN"
                        )

                        /*
                         * 좋아요 추가
                         */
                        .requestMatchers(
                                HttpMethod.POST,
                                "/api/words/*/like"
                        ).hasAnyRole(
                                "USER",
                                "ADMIN"
                        )

                        /*
                         * 좋아요 취소
                         */
                        .requestMatchers(
                                HttpMethod.DELETE,
                                "/api/words/*/like"
                        ).hasAnyRole(
                                "USER",
                                "ADMIN"
                        )

                        /*
                         * 나머지 API
                         */
                        .anyRequest()
                        .permitAll()
                )

                .exceptionHandling(handling ->
                        handling
                                .authenticationEntryPoint(
                                        (request, response, ex) ->
                                                response.sendError(
                                                        HttpServletResponse.SC_UNAUTHORIZED
                                                )
                                )
                                .accessDeniedHandler(
                                        (request, response, ex) ->
                                                response.sendError(
                                                        HttpServletResponse.SC_FORBIDDEN
                                                )
                                )
                )

                .formLogin(form ->
                        form.disable()
                )

                .httpBasic(basic ->
                        basic.disable()
                )

                .addFilterBefore(
                        new JwtAuthenticationFilter(
                                jwtProvider
                        ),
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config =
                new CorsConfiguration();

        config.setAllowedOrigins(
                allowedOrigins
        );

        config.setAllowedMethods(
                List.of(
                        "GET",
                        "POST",
                        "PUT",
                        "PATCH",
                        "DELETE",
                        "OPTIONS"
                )
        );

        config.setAllowedHeaders(
                List.of("*")
        );

        config.setAllowCredentials(true);

        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
                "/**",
                config
        );

        return source;
    }
}
