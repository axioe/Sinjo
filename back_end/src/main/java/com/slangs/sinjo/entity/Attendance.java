package com.slangs.sinjo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 로그인 출석 기록 1일치.
 * 하루에 여러 번 로그인해도 (user_id, attendance_date) 유니크 제약으로 한 행만 남는다.
 * 마이페이지 "이번 주 사용 기록" / 활동 통계 달력이 이 테이블을 읽는다.
 */
@Entity
@Table(
        name = "attendances",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "attendance_date"})
)
@Getter
@NoArgsConstructor
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "attendance_date", nullable = false)
    private LocalDate attendanceDate;

    public Attendance(User user, LocalDate attendanceDate) {
        this.user = user;
        this.attendanceDate = attendanceDate;
    }
}
