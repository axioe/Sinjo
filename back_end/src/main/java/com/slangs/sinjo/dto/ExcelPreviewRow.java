package com.slangs.sinjo.dto;

/**
 * 엑셀 미리보기 한 행.
 * status: OK(등록 가능) / DUPLICATE(이미 있음) / ERROR(형식 오류)
 */
public record ExcelPreviewRow(
        int rowNum,
        String word,
        String meaning,
        String example,
        String category,
        String era,
        String status,
        String message
) {}