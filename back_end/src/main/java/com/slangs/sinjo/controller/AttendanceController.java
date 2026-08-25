package com.slangs.sinjo.controller;

import com.slangs.sinjo.dto.AttendanceDto;
import com.slangs.sinjo.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    /** 마이페이지 "이번 주 사용 기록" / 활동 통계 달력용 출석 날짜. */
    @GetMapping("/me")
    public ResponseEntity<AttendanceDto.Response> getMyAttendance(@AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(attendanceService.getMyAttendance(userId));
    }
}
