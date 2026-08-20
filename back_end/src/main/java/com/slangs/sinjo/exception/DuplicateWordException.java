package com.slangs.sinjo.exception;

public class DuplicateWordException extends RuntimeException {
    public DuplicateWordException(String word) {
        super("이미 등록된 신조어입니다: " + word);
    }
}
