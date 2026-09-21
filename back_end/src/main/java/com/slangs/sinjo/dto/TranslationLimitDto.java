package com.slangs.sinjo.dto;

/** 하루 번역 사용량 (REQ-TR). */
public class TranslationLimitDto {

    /** 마이페이지 "오늘의 번역 사용량" 카드 + 검색 요청 전 한도 확인 양쪽에서 쓴다. */
    public record Usage(int used, int limit) {}
}
