package com.slangs.sinjo.controller;

import com.slangs.sinjo.service.WordProposalVoteService;
import com.slangs.sinjo.dto.WordProposalDto;
import com.slangs.sinjo.service.WordProposalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/proposals")
@RequiredArgsConstructor

public class WordProposalController {
    private final WordProposalService proposalService;
    // =========================================================
    // 제안글
    // =========================================================

    /**
     * 제안글 목록
     *
     * GET /api/proposals
     *
     * 예:
     * /api/proposals?page=0&size=10
     * /api/proposals?page=0&size=10&keyword=갓생
     * /api/proposals?page=0&size=10&keyword=갓생&sortType=LIKES
     */
    @GetMapping
    public Page<WordProposalDto.ListResponse> getProposals(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "LATEST") String sortType,
            @PageableDefault(size = 10) Pageable pageable
    ) {
        return proposalService.getProposals(
                keyword,
                sortType,
                pageable
        );
    }

    /**
     * 제안글 상세
     * GET /api/proposals/{id}
     * 상세 페이지 진입 시 조회수 +1
     */
    @GetMapping("/{id}")
    public ResponseEntity<WordProposalDto.DetailResponse> getProposal(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                proposalService.getProposal(userId, id)
        );
    }

    /**
     * 신조어 제안
     * POST /api/proposals
     */
    @PostMapping
    public ResponseEntity<WordProposalDto.DetailResponse> createProposal(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody WordProposalDto.CreateRequest request
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        proposalService.createProposal(
                                userId,
                                request
                        )
                );
    }


    /**
     * 제안 수정
     * PUT /api/proposals/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<WordProposalDto.DetailResponse> updateProposal(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id,
            @Valid @RequestBody WordProposalDto.UpdateRequest request
    ) {

        return ResponseEntity.ok(
                proposalService.updateProposal(
                        userId,
                        id,
                        request
                )
        );
    }

    /**
     * 제안 삭제
     * DELETE /api/proposals/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProposal(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long id
    ) {

        proposalService.deleteProposal(
                userId,
                id
        );

        return ResponseEntity.noContent().build();
    }


    // =========================================================
    // 댓글
    // =========================================================

    /**
     * 댓글 목록
     * GET /api/proposals/{proposalId}/comments
     */
    @GetMapping("/{proposalId}/comments")
    public ResponseEntity<List<WordProposalDto.CommentResponse>> getComments(
            @PathVariable Long proposalId
    ) {

        return ResponseEntity.ok(
                proposalService.getComments(
                        proposalId
                )
        );
    }


    /**
     * 댓글 작성
     * POST /api/proposals/{proposalId}/comments
     */
    @PostMapping("/{proposalId}/comments")
    public ResponseEntity<WordProposalDto.CommentResponse> createComment(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long proposalId,
            @Valid @RequestBody WordProposalDto.CommentRequest request
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        proposalService.createComment(
                                userId,
                                proposalId,
                                request
                        )
                );
    }

    /**
     * 댓글 수정
     * PATCH /api/proposals/comments/{commentId}
     */
    @PatchMapping("/comments/{commentId}")
    public ResponseEntity<WordProposalDto.CommentResponse> updateComment(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long commentId,
            @Valid @RequestBody WordProposalDto.CommentRequest request
    ) {

        return ResponseEntity.ok(
                proposalService.updateComment(
                        userId,
                        commentId,
                        request
                )
        );
    }


    /**
     * 댓글 삭제
     * DELETE /api/proposals/comments/{commentId}
     */
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long commentId
    ) {

        proposalService.deleteComment(
                userId,
                commentId
        );

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/suggestions")
    public ResponseEntity<List<String>> getSuggestions(
            @RequestParam String keyword
    ) {
        return ResponseEntity.ok(
                proposalService.getSuggestions(keyword)
        );
    }
}

