package com.slangs.sinjo.controller;

import com.slangs.sinjo.dto.WordProposalDto;
import com.slangs.sinjo.service.WordProposalAdminService;
import com.slangs.sinjo.service.WordProposalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/*
* 신조어 제안 / 토의 API
* 기본 경로 : /api/proposals
* 기능
* 1. 신조어 제안
* 2. 제안글 조회
* 3. 댓글
* 4. 대댓글
* 5. 후보 Word 등록
*/
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
     * GET /api/proposals
     */
    @GetMapping
    public ResponseEntity<List<WordProposalDto.ListResponse>> getProposals() {

        return ResponseEntity.ok(
                proposalService.getProposals()
        );
    }


    /**
     * 제안글 상세
     * GET /api/proposals/{id}
     * 상세 페이지 진입 시 조회수 +1
     */
    @GetMapping("/{id}")
    public ResponseEntity<WordProposalDto.DetailResponse> getProposal(
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(
                proposalService.getProposal(id)
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
     * 대댓글 작성
     * POST /api/proposals/{proposalId}/comments/{commentId}/replies
     */
    @PostMapping(
            "/{proposalId}/comments/{commentId}/replies"
    )
    public ResponseEntity<WordProposalDto.CommentResponse> createReply(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long proposalId,
            @PathVariable Long commentId,
            @Valid @RequestBody WordProposalDto.CommentRequest request
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        proposalService.createReply(
                                userId,
                                proposalId,
                                commentId,
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


    // =========================================================
    // 후보 Word
    // =========================================================

    /**
     * 후보 Word 목록
     * GET /api/proposals/{proposalId}/candidates
     */
    @GetMapping("/{proposalId}/candidates")
    public ResponseEntity<List<WordProposalDto.CandidateResponse>> getCandidates(
            @PathVariable Long proposalId
    ) {

        return ResponseEntity.ok(
                proposalService.getCandidates(
                        proposalId
                )
        );
    }


    /**
     * 새로운 후보 Word 등록
     * POST /api/proposals/{proposalId}/candidates
     * commentId가 있으면
     * "어떤 댓글에서 나온 후보인가"를 기록한다.
     */
    @PostMapping("/{proposalId}/candidates")
    public ResponseEntity<WordProposalDto.CandidateResponse> createCandidate(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long proposalId,
            @RequestParam(required = false) Long commentId,
            @Valid @RequestBody WordProposalDto.CandidateRequest request
    ) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        proposalService.createCandidate(
                                userId,
                                proposalId,
                                commentId,
                                request
                        )
                );
    }
}
