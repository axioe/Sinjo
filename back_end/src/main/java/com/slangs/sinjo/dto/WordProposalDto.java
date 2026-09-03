package com.slangs.sinjo.dto;

import com.slangs.sinjo.entity.WordProposal;
import com.slangs.sinjo.entity.WordProposalCandidate;
import com.slangs.sinjo.entity.WordProposalComment;
import com.slangs.sinjo.entity.WordProposalReview;

import java.time.LocalDateTime;
import java.util.List;

public class WordProposalDto {

    // =========================================================
    // 사용자 - 제안 목록
    // =========================================================

    public record ListResponse(
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
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {

        public static ListResponse from(WordProposal proposal) {
            return new ListResponse(
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

                    proposal.getCreatedAt(),
                    proposal.getUpdatedAt()
            );
        }
    }


    // =========================================================
    // 사용자 - 제안 상세
    // =========================================================

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

            LocalDateTime createdAt,
            LocalDateTime updatedAt,

            List<CommentResponse> comments,
            List<CandidateResponse> candidates,

            AiReview aiReview
    ) {

        public static DetailResponse from(
                WordProposal proposal,
                List<CommentResponse> comments,
                List<CandidateResponse> candidates,
                AiReview review
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

                    proposal.getCreatedAt(),
                    proposal.getUpdatedAt(),

                    comments,
                    candidates,
                    review
            );
        }
    }


    // =========================================================
    // 사용자 - 제안 등록
    // =========================================================

    public record CreateRequest(
            String proposedWord,
            String meaning,
            String example,
            String description,
            String sourceDescription
    ) {
    }


    // =========================================================
    // 사용자 - 제안 수정
    // =========================================================

    public record UpdateRequest(
            String proposedWord,
            String meaning,
            String example,
            String description,
            String sourceDescription
    ) {
    }


    // =========================================================
    // 댓글
    // =========================================================

    public record CommentResponse(
            Long id,
            Long userId,
            String nickname,
            Long parentId,
            String content,
            Long likes,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            List<CommentResponse> replies
    ) {

        public static CommentResponse from(
                WordProposalComment comment,
                List<CommentResponse> replies
        ) {
            return new CommentResponse(
                    comment.getId(),

                    comment.getUser().getId(),
                    comment.getUser().getNickname(),

                    comment.getParent() == null
                            ? null
                            : comment.getParent().getId(),

                    comment.getContent(),
                    comment.getLikes(),

                    comment.getCreatedAt(),
                    comment.getUpdatedAt(),

                    replies
            );
        }
    }


    // =========================================================
    // 댓글 작성 / 수정
    // =========================================================

    public record CommentRequest(
            String content
    ) {
    }


    // =========================================================
    // 후보 Word
    // =========================================================

    public record CandidateResponse(
            Long id,

            Long userId,
            String nickname,

            Long commentId,

            String word,
            String meaning,
            String example,
            String description,

            Long likes,
            String status,

            LocalDateTime createdAt
    ) {

        public static CandidateResponse from(
                WordProposalCandidate candidate
        ) {
            return new CandidateResponse(
                    candidate.getId(),

                    candidate.getUser().getId(),
                    candidate.getUser().getNickname(),

                    candidate.getComment() == null
                            ? null
                            : candidate.getComment().getId(),

                    candidate.getWord(),
                    candidate.getMeaning(),
                    candidate.getExample(),
                    candidate.getDescription(),

                    candidate.getLikes(),
                    candidate.getStatus().name(),

                    candidate.getCreatedAt()
            );
        }
    }


    // =========================================================
    // 후보 Word 등록
    // =========================================================

    public record CandidateRequest(
            String word,
            String meaning,
            String example,
            String description
    ) {
    }


    // =========================================================
    // 관리자 - 제안 목록
    // =========================================================

    public record AdminRow(
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

            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {

        public AdminRow(WordProposal proposal) {
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

                    proposal.getCreatedAt(),
                    proposal.getUpdatedAt()
            );
        }
    }


    // =========================================================
    // 관리자 - 제안 상세
    // =========================================================

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

            LocalDateTime createdAt,
            LocalDateTime updatedAt,

            List<Candidate> candidates,
            List<Comment> comments,

            AiReview aiReview
    ) {

        public AdminDetail(
                WordProposal proposal,
                List<Candidate> candidates,
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

                    proposal.getCreatedAt(),
                    proposal.getUpdatedAt(),

                    candidates,
                    comments,
                    aiReview
            );
        }
    }


    // =========================================================
    // 관리자 - 후보 Word
    // =========================================================

    public record Candidate(
            Long id,
            Long userId,
            String nickname,
            Long commentId,

            String word,
            String meaning,
            String example,
            String description,

            Long likes,
            String status,

            LocalDateTime createdAt
    ) {

        public Candidate(WordProposalCandidate candidate) {
            this(
                    candidate.getId(),

                    candidate.getUser().getId(),
                    candidate.getUser().getNickname(),

                    candidate.getComment() == null
                            ? null
                            : candidate.getComment().getId(),

                    candidate.getWord(),
                    candidate.getMeaning(),
                    candidate.getExample(),
                    candidate.getDescription(),

                    candidate.getLikes(),
                    candidate.getStatus().name(),

                    candidate.getCreatedAt()
            );
        }
    }


    // =========================================================
    // 관리자 - 댓글
    // =========================================================

    public record Comment(
            Long id,
            Long userId,
            String nickname,
            Long parentId,
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

                    comment.getParent() == null
                            ? null
                            : comment.getParent().getId(),

                    comment.getContent(),
                    comment.getLikes(),

                    comment.getCreatedAt(),
                    comment.getUpdatedAt()
            );
        }
    }


    // =========================================================
    // AI 검수 결과
    // =========================================================

    public record AiReview(
            Long id,
            ProposalReviewResult proposal,
            List<CandidateReviewResult> candidates,
            SummaryReviewResult summary,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
    }

    public record ProposalReviewResult(
            boolean duplicate,
            String recommendedCategory,
            String recommendation,
            double confidence,
            String opinion
    ) {
    }

    public record CandidateReviewResult(
            Long candidateId,
            boolean duplicate,
            String recommendation,
            double confidence,
            String opinion
    ) {
    }

    public record SummaryReviewResult(
            String recommendation,
            String opinion
    ) {
    }

    public record RejectRequest(
            String reason
    ) {
    }
}

