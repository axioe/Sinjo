package com.slangs.sinjo.exception;

public class DuplicateQuizWordException extends RuntimeException {
    public DuplicateQuizWordException(String word) {
        super("이미 등록된 퀴즈 단어입니다: " + word);
    }
}
