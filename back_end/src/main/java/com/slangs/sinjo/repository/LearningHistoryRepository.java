package com.slangs.sinjo.repository;

import com.slangs.sinjo.entity.LearningHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LearningHistoryRepository
        extends JpaRepository<LearningHistory, Long> {

    List<LearningHistory> findByUserId(Long userId);

    boolean existsByUserIdAndWordId(
            Long userId,
            Long wordId
    );

    void deleteByUserId(Long userId);
}
