package com.slangs.sinjo.dto;

public record WordAnswer(
        boolean found,
        String word,
        String meaning,
        String category,
        String answer
) {
}