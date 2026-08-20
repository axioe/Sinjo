package com.slangs.sinjo.security;

import com.slangs.sinjo.entity.Role;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

// [수정] @Component 를 붙이지 않는다. 붙이면 서블릿 컨테이너가 필터 빈을 자동 등록해
// SecurityConfig 에서 new 로 체인에 등록한 것과 이중으로 걸린다.
// SecurityConfig 에서 new 로 생성해 체인에만 등록한다.
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String HEADER = "Authorization";
    private static final String PREFIX = "Bearer ";

    private final JwtProvider jwtProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String token = resolveToken(request);

        if (token != null && jwtProvider.isValid(token)) {
            Long userId = jwtProvider.getUserId(token);

            if (userId != null) {
                Role role = jwtProvider.getRole(token);

                // 권한 목록을 함께 넣어야 SecurityConfig 의 hasRole("ADMIN") 이 동작한다.
                // 비워두면 토큰에 role 이 있어도 관리자 API 가 403 을 돌려준다.
                var authentication = new UsernamePasswordAuthenticationToken(
                        userId,
                        null,
                        List.of(new SimpleGrantedAuthority(role.getAuthority()))
                );

                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }

        filterChain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        String header = request.getHeader(HEADER);
        if (header != null && header.startsWith(PREFIX)) {
            String token = header.substring(PREFIX.length()).trim();
            return token.isEmpty() ? null : token;
        }
        return null;
    }
}
