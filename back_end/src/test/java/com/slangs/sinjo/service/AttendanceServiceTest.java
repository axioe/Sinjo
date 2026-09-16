package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.AttendanceDto;
import com.slangs.sinjo.entity.Attendance;
import com.slangs.sinjo.entity.User;
import com.slangs.sinjo.exception.UnauthorizedException;
import com.slangs.sinjo.repository.AttendanceRepository;
import com.slangs.sinjo.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * REQ-MYPAGE-05: 이번 주 사용 기록(출석) 조회.
 */
@ExtendWith(MockitoExtension.class)
class AttendanceServiceTest {

    @Mock
    private AttendanceRepository attendanceRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AttendanceService attendanceService;

    @Nested
    @DisplayName("REQ-MYPAGE-05: 출석 조회")
    class GetMyAttendance {

        @Test
        void 비로그인이면_예외() {
            assertThatThrownBy(() -> attendanceService.getMyAttendance(null))
                    .isInstanceOf(UnauthorizedException.class);
        }

        @Test
        void 출석한_날짜를_오름차순으로_돌려준다() {
            when(attendanceRepository.findAttendanceDateByUserId(1L)).thenReturn(List.of(
                    LocalDate.of(2026, 9, 10),
                    LocalDate.of(2026, 9, 8),
                    LocalDate.of(2026, 9, 9)
            ));

            AttendanceDto.Response response = attendanceService.getMyAttendance(1L);

            assertThat(response.activeDates()).containsExactly(
                    LocalDate.of(2026, 9, 8),
                    LocalDate.of(2026, 9, 9),
                    LocalDate.of(2026, 9, 10)
            );
        }
    }

    @Nested
    @DisplayName("출석 기록(로그인 시 자동 호출)")
    class CheckIn {

        @Test
        void 오늘_이미_출석했으면_다시_저장하지_않는다() {
            when(attendanceRepository.existsByUserIdAndAttendanceDate(1L, LocalDate.now())).thenReturn(true);

            attendanceService.checkIn(1L);

            verify(attendanceRepository, never()).save(any(Attendance.class));
        }

        @Test
        void 오늘_처음_출석하면_저장된다() {
            when(attendanceRepository.existsByUserIdAndAttendanceDate(1L, LocalDate.now())).thenReturn(false);
            when(userRepository.getReferenceById(1L)).thenReturn(new User());

            attendanceService.checkIn(1L);

            verify(attendanceRepository).save(any(Attendance.class));
        }
    }
}
