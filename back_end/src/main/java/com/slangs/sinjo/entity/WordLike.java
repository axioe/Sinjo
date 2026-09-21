package com.slangs.sinjo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "word_likes",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_word_like_word_user",
                        columnNames = {"word_id", "user_id"}
                )
        },
        indexes = {
                @Index(name = "idx_word_like_word_id", columnList = "word_id"),
                @Index(name = "idx_word_like_user_id", columnList = "user_id")
        }
)
@Getter
@NoArgsConstructor
public class WordLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 좋아요 대상 신조어
     * <p>
     * FK는 word_id로 저장된다.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "word_id", nullable = false)
    private Word word;

    /**
     * 좋아요를 누른 사용자
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public WordLike(
            Word word,
            User user
    ) {
        this.word = word;
        this.user = user;
        this.createdAt = LocalDateTime.now();
    }
}
