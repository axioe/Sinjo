package com.slangs.sinjo.repository;

import com.slangs.sinjo.entity.LoginHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface LoginHistoryRepository extends JpaRepository<LoginHistory, Long> {

    // 같은 사람이 하루에 여러 번 접속해도 1명으로 센다.
    @Query("""
        select function('date', h.createdAt), count(distinct h.userId)
        from LoginHistory h
        where h.createdAt >= :from
        group by function('date', h.createdAt)
        order by function('date', h.createdAt)
    """)
    List<Object[]> countDailyLogins(@Param("from") LocalDateTime from);
}