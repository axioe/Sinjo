package com.slangs.sinjo.controller;

import com.slangs.sinjo.dto.WordProposalDto;
import com.slangs.sinjo.service.WordProposalVoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/proposals")
@RequiredArgsConstructor
public class WordProposalVoteController {

    private final WordProposalVoteService voteService;

    /**
     * POST /api/proposals/{proposalId}/vote
     *
     * Body:
     * {
     *   "type": "LIKE"
     * }
     *
     * 또는
     *
     * {
     *   "type": "DISLIKE"
     * }
     */
    @PostMapping("/{proposalId}/vote")
    public ResponseEntity<WordProposalDto.VoteResponse> vote(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long proposalId,
            @RequestBody WordProposalDto.VoteRequest request
    ) {
        return ResponseEntity.ok(
                voteService.vote(userId, proposalId, request)
        );
    }
}
