package com.slangs.sinjo.dto;

import com.slangs.sinjo.entity.WordProposal;
import com.slangs.sinjo.entity.WordProposalComment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public class WordProposalDto {

    /*
     * ============================================================
     * 제안 목록
     * ============================================================
     */
    public record ListResponse(
            Long id,
            String proposedWord,
            String meaning,
            String nickname,
            String status,
            Long views,
            Long commentCount,
            Long likes,
            Long dislikes,
            LocalDateTime createdAt
    ) {

        public static ListResponse from(WordProposal proposal) {
            return new ListResponse(
                    proposal.getId(),
                    proposal.getProposedWord(),
                    proposal.getMeaning(),
                    proposal.getUser().getNickname(),
                    proposal.getStatus().name(),
                    proposal.getViews(),
                    proposal.getCommentCount(),
                    proposal.getLikes(),
                    proposal.getDislikes(),
                    proposal.getCreatedAt()
            );
        }
    }


    /*
     * ============================================================
     * 제안 상세
     * ============================================================
     */
    public record DetailResponse(
            Long id,
            String proposedWord,
            String meaning,
            String example,
            String description,
            String sourceDescription,

            Long userId,
            String nickname,

            String status,

            Long views,
            Long commentCount,

            Long likes,
            Long dislikes,

            String myVote,

            LocalDateTime createdAt,
            LocalDateTime updatedAt,

            List<CommentResponse> comments,

            AiReview aiReview
    ) {

        public static DetailResponse from(
                WordProposal proposal,
                List<CommentResponse> comments,
                AiReview aiReview,
                String myVote
        ) {
            return new DetailResponse(
                    proposal.getId(),
                    proposal.getProposedWord(),
                    proposal.getMeaning(),
                    proposal.getExample(),
                    proposal.getDescription(),
                    proposal.getSourceDescription(),

                    proposal.getUser().getId(),
                    proposal.getUser().getNickname(),

                    proposal.getStatus().name(),

                    proposal.getViews(),
                    proposal.getCommentCount(),

                    proposal.getLikes(),
                    proposal.getDislikes(),

                    myVote,

                    proposal.getCreatedAt(),
                    proposal.getUpdatedAt(),

                    comments,

                    aiReview
            );
        }
    }


    /*
     * ============================================================
     * 제안 등록
     * ============================================================
     */
    public record CreateRequest(

            @NotBlank(message = "단어를 입력해 주세요.")
            @Size(max = 100, message = "단어는 100자 이하로 입력해 주세요.")
            String proposedWord,

            @NotBlank(message = "의미를 입력해 주세요.")
            @Size(max = 500, message = "의미는 500자 이하로 입력해 주세요.")
            String meaning,

            @NotBlank(message = "사용 예시를 입력해 주세요.")
            @Size(max = 500, message = "사용 예시는 500자 이하로 입력해 주세요.")
            String example,

            @Size(max = 1000, message = "설명은 1000자 이하로 입력해 주세요.")
            String description,

            @Size(max = 500, message = "출처 설명은 500자 이하로 입력해 주세요.")
            String sourceDescription
    ) {
    }


    /*
     * ============================================================
     * 제안 수정
     * ============================================================
     */
    public record UpdateRequest(

            @NotBlank(message = "단어를 입력해 주세요.")
            @Size(max = 100, message = "단어는 100자 이하로 입력해 주세요.")
            String proposedWord,

            @NotBlank(message = "의미를 입력해 주세요.")
            @Size(max = 500, message = "의미는 500자 이하로 입력해 주세요.")
            String meaning,

            @NotBlank(message = "사용 예시를 입력해 주세요.")
            @Size(max = 500, message = "사용 예시는 500자 이하로 입력해 주세요.")
            String example,

            @Size(max = 1000, message = "설명은 1000자 이하로 입력해 주세요.")
            String description,

            @Size(max = 500, message = "출처 설명은 500자 이하로 입력해 주세요.")
            String sourceDescription
    ) {
    }


    /*
     * ============================================================
     * 투표 요청
     *
     * type:
     * LIKE
     * DISLIKE
     * ============================================================
     */
    public record VoteRequest(

            @NotBlank(message = "투표 유형을 선택해 주세요.")
            String type

    ) {
    }


    /*
     * ============================================================
     * 투표 결과
     * ============================================================
     */
    public record VoteResponse(
            Long proposalId,
            Long likes,
            Long dislikes,
            String myVote,
            String status
    ) {
    }


    /*
     * ============================================================
     * 댓글
     *
     * 대댓글 없음
     * ============================================================
     */
    public record CommentResponse(
            Long id,
            Long userId,
            String nickname,
            String content,
            Long likes,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {

        public static CommentResponse from(
                WordProposalComment comment
        ) {
            return new CommentResponse(
                    comment.getId(),
                    comment.getUser().getId(),
                    comment.getUser().getNickname(),
                    comment.getContent(),
                    comment.getLikes(),
                    comment.getCreatedAt(),
                    comment.getUpdatedAt()
            );
        }
    }


    /*
     * ============================================================
     * 댓글 작성 / 수정
     * ============================================================
     */
    public record CommentRequest(

            @NotBlank(message = "댓글 내용을 입력해 주세요.")
            @Size(max = 1000, message = "댓글은 1000자 이하로 입력해 주세요.")
            String content

    ) {
    }


    /*
     * ============================================================
     * 관리자 목록
     * ============================================================
     */
    public record AdminRow(
            Long id,
            String proposedWord,
            String meaning,
            String nickname,
            String status,
            Long views,
            Long commentCount,
            Long likes,
            Long dislikes,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {

        public AdminRow(WordProposal proposal) {
            this(
                    proposal.getId(),
                    proposal.getProposedWord(),
                    proposal.getMeaning(),
                    proposal.getUser().getNickname(),
                    proposal.getStatus().name(),
                    proposal.getViews(),
                    proposal.getCommentCount(),
                    proposal.getLikes(),
                    proposal.getDislikes(),
                    proposal.getCreatedAt(),
                    proposal.getUpdatedAt()
            );
        }
    }


    /*
     * ============================================================
     * 관리자 상세
     * ============================================================
     */
    public record AdminDetail(
            Long id,
            String proposedWord,
            String meaning,
            String example,
            String description,
            String sourceDescription,

            Long userId,
            String nickname,

            String status,

            Long views,
            Long commentCount,

            Long likes,
            Long dislikes,

            LocalDateTime createdAt,
            LocalDateTime updatedAt,

            String rejectReason,

            List<Comment> comments,

            AiReview aiReview
    ) {

        public AdminDetail(
                WordProposal proposal,
                List<Comment> comments,
                AiReview aiReview
        ) {
            this(
                    proposal.getId(),
                    proposal.getProposedWord(),
                    proposal.getMeaning(),
                    proposal.getExample(),
                    proposal.getDescription(),
                    proposal.getSourceDescription(),

                    proposal.getUser().getId(),
                    proposal.getUser().getNickname(),

                    proposal.getStatus().name(),

                    proposal.getViews(),
                    proposal.getCommentCount(),

                    proposal.getLikes(),
                    proposal.getDislikes(),

                    proposal.getCreatedAt(),
                    proposal.getUpdatedAt(),

                    proposal.getRejectReason(),

                    comments,

                    aiReview
            );
        }
    }


    /*
     * ============================================================
     * 관리자 댓글
     *
     * 대댓글 없음
     * ============================================================
     */
    public record Comment(
            Long id,
            Long userId,
            String nickname,
            String content,
            Long likes,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {

        public Comment(WordProposalComment comment) {
            this(
                    comment.getId(),
                    comment.getUser().getId(),
                    comment.getUser().getNickname(),
                    comment.getContent(),
                    comment.getLikes(),
                    comment.getCreatedAt(),
                    comment.getUpdatedAt()
            );
        }
    }


    /*
     * ============================================================
     * 관리자 제안 수정
     *
     * 관리자 화면에서 직접 제안 내용을 수정할 때 사용
     * ============================================================
     */
    public record AdminUpdateRequest(

            @NotBlank(message = "단어를 입력해 주세요.")
            @Size(max = 100, message = "단어는 100자 이하로 입력해 주세요.")
            String proposedWord,

            @NotBlank(message = "의미를 입력해 주세요.")
            @Size(max = 500, message = "의미는 500자 이하로 입력해 주세요.")
            String meaning,

            @NotBlank(message = "사용 예시를 입력해 주세요.")
            @Size(max = 500, message = "사용 예시는 500자 이하로 입력해 주세요.")
            String example,

            @Size(max = 1000, message = "설명은 1000자 이하로 입력해 주세요.")
            String description,

            @Size(max = 500, message = "출처 설명은 500자 이하로 입력해 주세요.")
            String sourceDescription
    ) {
    }


    /*
     * ============================================================
     * AI 검수 결과
     * ============================================================
     */
    public record AiReview(
            Long id,
            ProposalReviewResult proposal,
            SummaryReviewResult summary,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
    }


    /*
     * ============================================================
     * AI 제안 검수 결과
     * ============================================================
     */
    public record ProposalReviewResult(
            Boolean duplicate,
            String recommendedCategory,
            String recommendation,
            Double confidence,
            String opinion
    ) {
    }


    /*
     * ============================================================
     * AI 최종 요약
     * ============================================================
     */
    public record SummaryReviewResult(
            String recommendation,
            String opinion
    ) {
    }
}