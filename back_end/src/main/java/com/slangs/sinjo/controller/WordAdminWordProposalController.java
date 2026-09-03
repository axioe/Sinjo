package com.slangs.sinjo.controller;

import com.slangs.sinjo.dto.ApproveRequest;
import com.slangs.sinjo.dto.WordDto;
import com.slangs.sinjo.dto.WordProposalDto;
import com.slangs.sinjo.service.WordProposalAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/proposals")
@RequiredArgsConstructor
public class WordAdminWordProposalController {

    private final WordProposalAdminService wordProposalAdminService;

    /**
     * 관리자 제안 목록
     */
    @GetMapping
    public ResponseEntity<List<WordProposalDto.AdminRow>> getProposals() {

        return ResponseEntity.ok(
                wordProposalAdminService.getProposals()
        );
    }

    /**
     * 관리자 제안 상세
     */
    @GetMapping("/{proposalId}")
    public ResponseEntity<WordProposalDto.AdminDetail> getProposal(
            @PathVariable Long proposalId
    ) {

        return ResponseEntity.ok(
                wordProposalAdminService.getProposal(proposalId)
        );
    }

    /**
     * 관리자 검수 요청 *
     *  DISCUSSION  -> REVIEW_REQUESTED
     */
    @PostMapping("/{proposalId}/review-request")
    public ResponseEntity<WordProposalDto.AdminDetail> requestReview(
            @PathVariable Long proposalId
    ) {

        return ResponseEntity.ok(
                wordProposalAdminService.requestReview(proposalId)
        );
    }

    /*
     * AI 검수 실행 *
     *  REVIEW_REQUESTED -> AI_REVIEWED
     */
    @PostMapping("/{proposalId}/ai-review")
    public ResponseEntity<WordProposalDto.AdminDetail> executeAiReview(
            @PathVariable Long proposalId
    ) {

        return ResponseEntity.ok(
                wordProposalAdminService.executeAiReview(
                        proposalId
                )
        );
    }

    /*
     *관리자 승인 *
     *  REVIEW_REQUESTED -> APPROVED
     */
    @PostMapping("/{proposalId}/approve")
    public ResponseEntity<WordDto> approve(
            @PathVariable Long proposalId,
            @RequestBody ApproveRequest request
    ) {

        return ResponseEntity.ok(
                wordProposalAdminService.approve(
                        proposalId,
                        request
                )
        );
    }

    /**
     * 관리자 반려 *
     * REVIEW_REQUESTED / AI_REVIEWED -> REJECTED
     */
    @PatchMapping("/{proposalId}/reject")
    public ResponseEntity<WordProposalDto.AdminDetail> reject(
            @PathVariable Long proposalId
    ) {
        return ResponseEntity.ok(
                wordProposalAdminService.reject(proposalId)
        );
    }
}