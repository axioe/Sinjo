package com.slangs.sinjo.entity;

import com.slangs.sinjo.dto.QuizDto;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 게임(퀴즈) 플레이 결과 1회분.
 * 로그인한 사용자만 저장한다 (QuizService.saveAttempt 참고).
 */
@Entity
@Table(name = "quiz_attempts")
@Getter
@NoArgsConstructor
public class QuizAttempt extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "quiz_type", nullable = false, length = 20)
    private QuizDto.QuizType quizType;

    @Column(nullable = false)
    private int score;

    @Column(nullable = false)
    private int total;

    public QuizAttempt(User user, QuizDto.QuizType quizType, int score, int total) {
        this.user = user;
        this.quizType = quizType;
        this.score = score;
        this.total = total;
    }
}
