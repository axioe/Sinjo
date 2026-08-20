package com.slangs.sinjo.dto;

import com.slangs.sinjo.entity.Word;
import lombok.Getter;

@Getter
public class WordDto {

    private Long id;

    private String word;

    private String meaning;

    private String example;

    private Long likes;

    private Long views;

    private Integer rank;

    private String category;

    private String era;

    public WordDto(Word word) {

        this.id = word.getId();
        this.word = word.getWord();
        this.meaning = word.getMeaning();
        this.example = word.getExample();
        this.likes = word.getLikes();
        this.views = word.getViews();
        this.category = word.getCategory();
        this.era = word.getEra();
    }

    public WordDto(
            Word word,
            Integer rank
    ) {

        this.id = word.getId();
        this.word = word.getWord();
        this.meaning = word.getMeaning();
        this.example = word.getExample();
        this.likes = word.getLikes();
        this.views = word.getViews();
        this.rank = rank;
        this.category = word.getCategory();
        this.era = word.getEra();
    }
}
