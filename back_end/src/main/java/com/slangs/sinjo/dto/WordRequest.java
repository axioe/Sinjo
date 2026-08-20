package com.slangs.sinjo.dto;

public record WordRequest(
        String word,
        String meaning,
        String example,
        String category,
        String era
) {
}
