package com.slangs.sinjo.repository;

import com.slangs.sinjo.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    boolean existsByUserIdAndAttendanceDate(Long userId, LocalDate attendanceDate);

    /** 마이페이지 "이번 주 사용 기록" / 활동 통계 달력용. */
    List<LocalDate> findAttendanceDateByUserId(Long userId);
}
