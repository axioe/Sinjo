package com.slangs.sinjo.security;

import com.slangs.sinjo.entity.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtProvider {

    /** HS256 서명 키의 최소 길이. 이보다 짧으면 jjwt 가 예외를 던지며 앱이 뜨지 않는다. */
    private static final int MIN_SECRET_BYTES = 32;

    private final SecretKey key;
    private final long expirationMillis;

    public JwtProvider(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration}") long expirationMillis
    ) {
        byte[] secretBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                    "app.jwt.secret 이 너무 짧습니다. UTF-8 기준 " + MIN_SECRET_BYTES
                            + "바이트 이상이어야 합니다. (현재 " + secretBytes.length + "바이트)");
        }

        this.key = Keys.hmacShaKeyFor(secretBytes);
        this.expirationMillis = expirationMillis;
    }

    /**
     * 로그인 성공 시 토큰 만들기.
     *
     * role 을 함께 담는 이유:
     * 담아두지 않으면 요청이 올 때마다 DB 를 조회해 권한을 확인해야 한다.
     * 토큰에 있으면 서명 검증만으로 관리자인지 알 수 있다.
     *
     * 주의: 토큰 내용은 누구나 열어볼 수 있다(암호화가 아니라 서명이다).
     * 그래서 role 처럼 공개돼도 되는 값만 담고, 비밀번호 같은 건 절대 담지 않는다.
     */
    public String createToken(Long userId, String email, Role role) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMillis);

        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("email", email)
                .claim("role", role.name())
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    /** 토큰에서 회원 id 꺼내기. 잘못된 토큰이면 null. */
    public Long getUserId(String token) {
        try {
            return Long.valueOf(parse(token).getSubject());
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }

    /**
     * 토큰에서 권한 꺼내기.
     *
     * role 이 없거나 알 수 없는 값이면 USER 로 본다.
     * 관리자 기능을 붙이기 전에 발급된 옛 토큰에는 role 이 없는데,
     * 그 경우 예외를 던지면 기존 사용자가 전부 로그인 불가가 된다.
     * 모르면 낮은 권한으로 처리하는 쪽이 안전하다.
     */
    public Role getRole(String token) {
        try {
            String role = parse(token).get("role", String.class);
            return role == null ? Role.USER : Role.valueOf(role);
        } catch (JwtException | IllegalArgumentException e) {
            return Role.USER;
        }
    }

    /** 유효한 토큰인지 확인 */
    public boolean isValid(String token) {
        try {
            parse(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
