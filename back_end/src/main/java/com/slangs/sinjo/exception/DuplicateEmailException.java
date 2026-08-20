package com.slangs.sinjo.exception;

// 이메일 중복 오류

public class DuplicateEmailException extends RuntimeException {
    public DuplicateEmailException() {
        super("이미 사용 중인 이메일입니다.");
    }
}
