package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.AttendanceDto;
import com.slangs.sinjo.entity.Attendance;
import com.slangs.sinjo.exception.UnauthorizedException;
import com.slangs.sinjo.repository.AttendanceRepository;
import com.slangs.sinjo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * 로그인 출석 (REQ-MY-01).
 * UserService.login / NaverService.naverLogin 이 로그인에 성공한 직후 checkIn 을 호출한다.
 */
@Service
@RequiredArgsConstructor
public class AttendanceService {

    /** [추가] 출석 체크 1회당 적립 포인트. PointService.SHOP_ITEMS 가격 기준으로 정한 값이다. */
    private static final int ATTENDANCE_POINT = 50;

    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;
    private final PointService pointService;

    /**
     * 오늘 출석을 기록한다.
     * 이미 오늘 출석했다면(하루에 여러 번 로그인) 아무 것도 하지 않는다 - 로그인 자체를
     * 막을 이유는 아니라서 예외를 던지지 않고 조용히 건너뛴다. 포인트도 같은 이유로
     * 새로 기록될 때만 적립한다(하루에 여러 번 로그인해도 중복 적립되지 않도록).
     */
    @Transactional
    public void checkIn(Long userId) {
        LocalDate today = LocalDate.now();

        if (attendanceRepository.existsByUserIdAndAttendanceDate(userId, today)) {
            return;
        }

        attendanceRepository.save(new Attendance(userRepository.getReferenceById(userId), today));
        pointService.earn(userId, ATTENDANCE_POINT, "출석 체크");
    }

    /** 마이페이지 화면이라 UserController.mypage 와 같은 패턴으로 비로그인은 401 로 막는다. */
    @Transactional(readOnly = true)
    public AttendanceDto.Response getMyAttendance(Long userId) {
        if (userId == null) {
            throw new UnauthorizedException();
        }

        List<LocalDate> activeDates = attendanceRepository.findAttendanceDateByUserId(userId).stream()
                .sorted()
                .toList();

        return new AttendanceDto.Response(activeDates);
    }
}
