package com.slangs.sinjo.repository;


import com.slangs.sinjo.entity.QuizWord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface QuizRepository extends JpaRepository<QuizWord, Long> {

    // RAND() 는 MySQL 전용 함수라 PostgreSQL 에서 실패한다.
    // id만 읽어 Java 에서 셔플하는 방식을 쓴다 (QuizService 참고).
    @Query("SELECT q.id FROM QuizWord q")
    List<Long> findAllIds();
}