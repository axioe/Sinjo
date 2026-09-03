package com.slangs.sinjo.dto;

public record ApproveRequest(
        Long candidateId,
        String category,
        String era
) {
}