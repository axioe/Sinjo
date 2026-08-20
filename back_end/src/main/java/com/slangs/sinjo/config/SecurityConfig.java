package com.slangs.sinjo.config;

import com.slangs.sinjo.security.JwtAuthenticationFilter;
import com.slangs.sinjo.security.JwtProvider;
import jakarta.servlet.DispatcherType;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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

    /** 하드코딩하지 않고 application.yaml 에서 읽는다. 배포 시 주소만 바꾸면 된다. */
    @Value("${app.cors.allowed-origins}")
    private List<String> allowedOrigins;

    /**
     * 비밀번호 해시 도구.
     * 이 빈이 없으면 UserService 가 주입받지 못해 앱이 뜨지 않는다.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())

                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                .authorizeHttpRequests(auth -> auth
                        // forward/error 디스패치까지 인가 검사 대상이라, 이 줄이 없으면
                        // 예외 발생 시 원인 대신 401 만 보게 된다.
                        .dispatcherTypeMatchers(DispatcherType.FORWARD, DispatcherType.ERROR).permitAll()
                        // 개발 단계라 전부 열어둔다.
                        // 배포 전에 /api/admin/** 등 보호 대상을 지정할 것.
                        // [수정] 관리자 API 는 ADMIN 권한이 있어야만 통과한다.
                        // 컨트롤러마다 확인하지 않고 여기 한 곳에서 막는다.
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")

                        // 나머지는 아직 개발 중이라 열어둔다.
                        .anyRequest().permitAll()
                )

                .exceptionHandling(handling -> handling
                        .authenticationEntryPoint((request, response, ex) ->
                                response.sendError(HttpServletResponse.SC_UNAUTHORIZED))
                        .accessDeniedHandler((request, response, ex) ->
                                response.sendError(HttpServletResponse.SC_FORBIDDEN))
                )

                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())

                .addFilterBefore(new JwtAuthenticationFilter(jwtProvider), UsernamePasswordAuthenticationFilter.class);


        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(allowedOrigins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
