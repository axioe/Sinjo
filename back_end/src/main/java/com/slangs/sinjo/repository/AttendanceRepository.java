package com.slangs.sinjo.repository;

import com.slangs.sinjo.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    boolean existsByUserIdAndAttendanceDate(Long userId, LocalDate attendanceDate);

    /**
     * 마이페이지 "이번 주 사용 기록" / 활동 통계 달력용.
     * findAttendanceDateByUserId 같은 이름 기반 파생 쿼리는 "AttendanceDate" 를
     * 프로젝션(select 절)으로 해석해 주지 않는다 - 엔티티 전체를 조회한 뒤
     * List<LocalDate> 로 변환하려다 ConverterNotFoundException 이 났다.
     * QuizRepository.findAllIds() 처럼 명시적으로 select 할 컬럼을 JPQL 에 적는다.
     */
    @Query("SELECT a.attendanceDate FROM Attendance a WHERE a.user.id = :userId")
    List<LocalDate> findAttendanceDateByUserId(@Param("userId") Long userId);

    /** 관리자가 회원을 삭제할 때 먼저 지운다 - user_id 가 FK(nullable = false)라 남아있으면 삭제가 막힌다. */
    void deleteByUserId(Long userId);
}
