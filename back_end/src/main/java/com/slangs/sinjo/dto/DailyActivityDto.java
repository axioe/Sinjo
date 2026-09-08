package com.slangs.sinjo.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 마이페이지 활동 통계 달력에서 특정 날짜를 클릭했을 때 보여줄 그 날의 활동 내역 (REQ-MY-01).
 * 번역 기록과 퀴즈 응시 기록을 한 목록으로 합쳐 시각순으로 내려준다.
 */
public class DailyActivityDto {

    /** type 은 프론트가 아이콘을 구분하는 용도 - "TRANSLATION" 또는 "QUIZ". */
    public record Item(
            String type,
            String title,
            String detail,
            LocalDateTime createdAt
    ) {}

    public record Response(
            List<Item> items
    ) {}
}
