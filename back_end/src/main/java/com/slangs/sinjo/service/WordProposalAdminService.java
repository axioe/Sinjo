package com.slangs.sinjo.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.slangs.sinjo.dto.ApproveRequest;
import com.slangs.sinjo.dto.WordDto;
import com.slangs.sinjo.dto.WordProposalDto;
import com.slangs.sinjo.entity.CandidateStatus;
import com.slangs.sinjo.entity.ProposalStatus;
import com.slangs.sinjo.entity.WordProposal;
import com.slangs.sinjo.entity.WordProposalCandidate;
import com.slangs.sinjo.entity.WordProposalReview;
import com.slangs.sinjo.exception.NotFoundException;
import com.slangs.sinjo.repository.WordProposalCandidateRepository;
import com.slangs.sinjo.repository.WordProposalRepository;
import com.slangs.sinjo.repository.WordProposalReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WordProposalAdminService {

    private final WordProposalRepository proposalRepository;
    private final WordProposalCandidateRepository candidateRepository;
    private final WordProposalReviewRepository reviewRepository;

    private final WordProposalService proposalService;
    private final WordProposalAiReviewService aiReviewService;
    private final WordService wordService;
    private final ObjectMapper objectMapper;

    // =========================================================
    // 제안 목록
    // =========================================================

    @Transactional(readOnly = true)
    public List<WordProposalDto.AdminRow> getProposals() {

        return proposalRepository
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .map(WordProposalDto.AdminRow::new)
                .toList();
    }


    // =========================================================
    // 제안 상세
    // =========================================================

    @Transactional(readOnly = true)
    public WordProposalDto.AdminDetail getProposal(
            Long proposalId
    ) {

        WordProposal proposal =
                findProposal(proposalId);

        List<WordProposalDto.Candidate> candidates =
                candidateRepository
                        .findByProposalIdOrderByLikesDescCreatedAtAsc(
                                proposalId
                        )
                        .stream()
                        .map(WordProposalDto.Candidate::new)
                        .toList();

        List<WordProposalDto.Comment> comments =
                proposalService
                        .getComments(proposalId)
                        .stream()
                        .map(comment ->
                                new WordProposalDto.Comment(
                                        comment.id(),
                                        comment.userId(),
                                        comment.nickname(),
                                        comment.parentId(),
                                        comment.content(),
                                        comment.likes(),
                                        comment.createdAt(),
                                        comment.updatedAt()
                                )
                        )
                        .toList();

        WordProposalReview review =
                reviewRepository
                        .findByProposalId(proposalId)
                        .orElse(null);

        WordProposalDto.AiReview aiReview =
                convertAiReview(review);

        return new WordProposalDto.AdminDetail(
                proposal,
                candidates,
                comments,
                aiReview
        );
    }


    private WordProposalDto.AiReview convertAiReview(
            WordProposalReview review
    ) {

        if (review == null) {
            return null;
        }

        try {

            JsonNode root =
                    objectMapper.readTree(
                            review.getRawResponse()
                    );

            // -----------------------------------------
            // proposal
            // -----------------------------------------

            WordProposalDto.ProposalReviewResult proposalResult =
                    objectMapper.treeToValue(
                            root.get("proposal"),
                            WordProposalDto.ProposalReviewResult.class
                    );

            // -----------------------------------------
            // candidates
            // -----------------------------------------

            List<WordProposalDto.CandidateReviewResult> candidateResults =
                    objectMapper
                            .readerForListOf(
                                    WordProposalDto.CandidateReviewResult.class
                            )
                            .readValue(
                                    root.get("candidates")
                            );

            // -----------------------------------------
            // summary
            // -----------------------------------------

            WordProposalDto.SummaryReviewResult summaryResult =
                    objectMapper.treeToValue(
                            root.get("summary"),
                            WordProposalDto.SummaryReviewResult.class
                    );

            // -----------------------------------------
            // 최종 DTO
            // -----------------------------------------

            return new WordProposalDto.AiReview(
                    review.getId(),
                    proposalResult,
                    candidateResults,
                    summaryResult,
                    review.getCreatedAt(),
                    review.getUpdatedAt()
            );

        } catch (Exception e) {

            throw new IllegalStateException(
                    "AI 검수 결과를 변환할 수 없습니다.",
                    e
            );
        }
    }
    // =========================================================
    // 관리자 검수 요청
    // =========================================================

    @Transactional
    public WordProposalDto.AdminDetail requestReview(
            Long proposalId
    ) {

        WordProposal proposal = findProposal(proposalId);

        if (proposal.getStatus()
                != ProposalStatus.DISCUSSION) {

            throw new IllegalStateException(
                    "토의 중인 제안만 검수 요청할 수 있습니다."
            );
        }

        proposal.setStatus(
                ProposalStatus.REVIEW_REQUESTED
        );

        return getProposal(proposalId);
    }


    // =========================================================
    // AI 검수
    // =========================================================

    @Transactional
    public WordProposalDto.AdminDetail executeAiReview(
            Long proposalId
    ) {

        WordProposal proposal =
                findProposal(proposalId);

        if (proposal.getStatus()
                != ProposalStatus.REVIEW_REQUESTED) {

            throw new IllegalStateException(
                    "관리자 검수 요청 상태에서만 AI 검수를 실행할 수 있습니다."
            );
        }

        /*
         * AI 검수 서비스에서
         *
         * 1. 기존 Word 검색
         * 2. OpenAI 호출
         * 3. JSON 검증
         * 4. WordProposalReview 저장
         * 5. AI_REVIEWED 변경
         *
         * 을 모두 처리한다.
         */
        aiReviewService.review(proposalId);

        return getProposal(proposalId);
    }

    // =========================================================
    // 관리자 승인
    // =========================================================

    @Transactional
    public WordDto approve(
            Long proposalId,
            ApproveRequest request
    ) {

        WordProposal proposal =
                findProposal(proposalId);

        if (proposal.getStatus()
                != ProposalStatus.AI_REVIEWED) {

            throw new IllegalStateException(
                    "AI 검수가 완료된 제안만 승인할 수 있습니다."
            );
        }

        if (request == null) {
            throw new IllegalArgumentException(
                    "승인 정보를 입력해 주세요."
            );
        }

        if (request.candidateId() == null) {
            throw new IllegalArgumentException(
                    "승인할 후보를 선택해 주세요."
            );
        }

        WordProposalCandidate candidate =
                candidateRepository
                        .findByIdAndProposalId(
                                request.candidateId(),
                                proposalId
                        )
                        .orElseThrow(() ->
                                new NotFoundException(
                                        "해당 제안글의 후보 신조어를 찾을 수 없습니다."
                                )
                        );

        if (candidate.getStatus()
                != CandidateStatus.AI_REVIEWED) {

            throw new IllegalStateException(
                    "이미 처리된 후보입니다."
            );
        }

        String category =
                required(
                        request.category(),
                        "카테고리를 입력해 주세요."
                );

        String era = trim(request.era());
        /*
         * 후보 → 실제 Word 등록
         * WordService 내부에서
         * DB 저장 + VectorStore 저장
         */
        WordDto savedWord =
                wordService.createFromProposal(
                        candidate.getWord(),
                        candidate.getMeaning(),
                        candidate.getExample(),
                        category,
                        era
                );

        /*
         * 후보 승인
         */
        candidate.setStatus(
                CandidateStatus.APPROVED
        );

        /*
         * 제안 승인
         */
        proposal.setStatus(
                ProposalStatus.APPROVED
        );

        return savedWord;
    }


    // =========================================================
    // 관리자 반려
    // =========================================================

    @Transactional
    public WordProposalDto.AdminDetail reject(
            Long proposalId
    ) {

        WordProposal proposal =
                findProposal(proposalId);

        if (proposal.getStatus()
                != ProposalStatus.AI_REVIEWED) {

            throw new IllegalStateException(
                    "AI 검수가 완료된 제안만 반려할 수 있습니다."
            );
        }

        proposal.setStatus(
                ProposalStatus.REJECTED
        );

        return getProposal(proposalId);
    }


    // =========================================================
    // 내부 메서드
    // =========================================================

    private WordProposal findProposal(
            Long proposalId
    ) {

        return proposalRepository
                .findById(proposalId)
                .orElseThrow(() ->
                        new NotFoundException(
                                "신조어 제안을 찾을 수 없습니다."
                        )
                );
    }


    private String required(
            String value,
            String message
    ) {

        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }

        return value.trim();
    }


    private String trim(String value) {

        if (value == null) {
            return null;
        }

        String trimmed = value.trim();

        return trimmed.isBlank()
                ? null
                : trimmed;
    }
}