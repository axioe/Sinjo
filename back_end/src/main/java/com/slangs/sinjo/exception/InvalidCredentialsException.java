package com.slangs.sinjo.exception;

/**
 * 계정이 없는 경우와 비밀번호가 틀린 경우를 하나로 묶는다.
 * 구분해서 알려주면 어떤 이메일이 가입되어 있는지 알아낼 수 있다.
 */
public class InvalidCredentialsException extends RuntimeException {
    public InvalidCredentialsException() {
        super("이메일 또는 비밀번호가 올바르지 않습니다.");
    }
}
