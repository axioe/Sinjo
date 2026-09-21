package com.slangs.sinjo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "word_likes",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_word_like_user_word",
                        columnNames = {
                                "user_id",
                                "word_id"
                        }
                )
        }
)
@Getter
@NoArgsConstructor
public class WordLike extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "user_id",
            nullable = false
    )
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
            name = "word_id",
            nullable = false
    )
    private Word word;

    public WordLike(
            User user,
            Word word
    ) {
        this.user = user;
        this.word = word;
    }
}
