package com.slangs.sinjo.controller;

import com.slangs.sinjo.dto.ApproveRequest;
import com.slangs.sinjo.dto.RejectRequest;
import com.slangs.sinjo.dto.WordDto;
import com.slangs.sinjo.dto.WordProposalDto;
import com.slangs.sinjo.service.WordProposalAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/proposals")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class WordAdminProposalController {

    private final WordProposalAdminService wordProposalAdminService;

    /**
     * 관리자 - 제안 목록 조회
     */
    @GetMapping
    public ResponseEntity<List<WordProposalDto.AdminRow>> getProposals() {
        return ResponseEntity.ok(
                wordProposalAdminService.getProposals()
        );
    }

    /**
     * 관리자 - 제안 상세 조회
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
     * 관리자 - 제안 내용 수정
     *
     * AI 검수 결과가 존재하면 기존 결과를 삭제하고
     * 다시 검수할 수 있도록 REVIEW_REQUESTED 상태로 되돌린다.
     */
    @PatchMapping("/{proposalId}")
    public ResponseEntity<WordProposalDto.AdminDetail> updateProposal(
            @PathVariable Long proposalId,
            @RequestBody WordProposalDto.AdminUpdateRequest request
    ) {
        return ResponseEntity.ok(
                wordProposalAdminService.updateProposal(
                        proposalId,
                        request
                )
        );
    }

    /**
     * 관리자 - AI 검수 실행
     *
     * AI 검수는 선택 사항이다.
     * REVIEW_REQUESTED 상태에서만 실행할 수 있다.
     */
    @PostMapping("/{proposalId}/ai-review")
    public ResponseEntity<WordProposalDto.AdminDetail> executeAiReview(
            @PathVariable Long proposalId
    ) {
        return ResponseEntity.ok(
                wordProposalAdminService.executeAiReview(proposalId)
        );
    }

    /**
     * 관리자 - 제안 승인
     *
     * 후보 Word를 선택하지 않고
     * 현재 제안 내용을 그대로 실제 Word로 생성한다.
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
     * 관리자 - 제안 반려
     *
     * 반려 사유는 선택 사항이다.
     */
    @PatchMapping("/{proposalId}/reject")
    public ResponseEntity<WordProposalDto.AdminDetail> reject(
            @PathVariable Long proposalId,
            @RequestBody(required = false) RejectRequest request
    ) {
        return ResponseEntity.ok(
                wordProposalAdminService.reject(
                        proposalId,
                        request
                )
        );
    }
}
