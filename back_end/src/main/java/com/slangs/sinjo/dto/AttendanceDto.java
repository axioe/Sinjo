package com.slangs.sinjo.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * 마이페이지 "이번 주 사용 기록" / 활동 통계 달력용 (REQ-MY-01).
 */
public class AttendanceDto {

    /** 로그인 출석한 날짜 목록. 하루에 여러 번 로그인해도 날짜당 하나만 들어 있다. */
    public record Response(
            List<LocalDate> activeDates
    ) {}
}
