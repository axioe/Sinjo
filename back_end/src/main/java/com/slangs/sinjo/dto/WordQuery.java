package com.slangs.sinjo.dto;

public record WordQuery(
        QueryType queryType,
        String word,
        String category,
        String searchQuery
) {
}
