package com.slangs.sinjo.exception;

/**
 * [신규] 토큰이 없거나 만료되어 "요청자가 누구인지" 알 수 없을 때 던진다.
 *
 * 로그인 실패(InvalidCredentialsException)와 메시지를 구분해야
 * 프론트에서 "비밀번호가 틀렸습니다" 와 "다시 로그인해 주세요" 를 다르게 안내할 수 있다.
 */
public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException() {
        super("로그인이 필요합니다.");
    }
}
