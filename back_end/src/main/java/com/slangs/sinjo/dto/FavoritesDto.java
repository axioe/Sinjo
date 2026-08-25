package com.slangs.sinjo.dto;

import java.time.LocalDateTime;

public record FavoritesDto(
        Long id,
        Long wordId,
        String word,
        String meaning,
        String category,
        LocalDateTime createdAt
) {}