package com.slangs.sinjo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor
@Table(name = "learning_history")
public class LearningHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    private Long wordId;

    @Column(nullable = false)
    private LocalDateTime learnedAt;

    public LearningHistory(
            Long userId,
            Long wordId
    ) {
        this.userId = userId;
        this.wordId = wordId;
        this.learnedAt = LocalDateTime.now();
    }
}