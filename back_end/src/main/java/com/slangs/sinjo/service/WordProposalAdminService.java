package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.ApproveRequest;
import com.slangs.sinjo.dto.RejectRequest;
import com.slangs.sinjo.dto.WordDto;
import com.slangs.sinjo.dto.WordProposalDto;
import com.slangs.sinjo.entity.ProposalStatus;
import com.slangs.sinjo.entity.WordProposal;
import com.slangs.sinjo.entity.WordProposalReview;
import com.slangs.sinjo.repository.WordProposalCommentRepository;
import com.slangs.sinjo.repository.WordProposalRepository;
import com.slangs.sinjo.repository.WordProposalReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WordProposalAdminService {

    private final WordProposalRepository proposalRepository;
    private final WordProposalCommentRepository commentRepository;
    private final WordProposalReviewRepository reviewRepository;

    private final WordService wordService;
    private final WordProposalAiReviewService aiReviewService;

    @Transactional(readOnly = true)
    public List<WordProposalDto.AdminRow> getProposals() {
        return proposalRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(WordProposalDto.AdminRow::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public WordProposalDto.AdminDetail getProposal(Long proposalId) {
        return getAdminDetail(proposalId);
    }

    @Transactional
    public WordProposalDto.AdminDetail updateProposal(
            Long proposalId,
            WordProposalDto.AdminUpdateRequest request
    ) {
        WordProposal proposal = findProposal(proposalId);

        if (request == null) {
            throw new IllegalArgumentException("수정 내용을 입력해 주세요.");
        }

        String proposedWord = required(
                request.proposedWord(),
                "단어를 입력해 주세요."
        );
        String meaning = required(
                request.meaning(),
                "의미를 입력해 주세요."
        );
        String example = required(
                request.example(),
                "사용 예시를 입력해 주세요."
        );

        if (!proposal.getProposedWord().equals(proposedWord)
                && proposalRepository.existsByProposedWord(proposedWord)) {
            throw new IllegalArgumentException(
                    "이미 동일한 단어가 제안되어 있습니다."
            );
        }

        /*
         * 관리자 수정 시 기존 AI 검수 결과는 더 이상
         * 현재 제안 내용과 일치한다고 볼 수 없으므로 삭제한다.
         */
        reviewRepository.findByProposalId(proposalId)
                .ifPresent(reviewRepository::delete);

        proposal.setProposedWord(proposedWord);
        proposal.setMeaning(meaning);
        proposal.setExample(example);
        proposal.setDescription(trim(request.description()));
        proposal.setSourceDescription(trim(request.sourceDescription()));

        /*
         * AI 검수 이후 내용이 변경되었다면
         * 다시 REVIEW_REQUESTED 상태에서 검수하도록 한다.
         */
        if (proposal.getStatus() == ProposalStatus.AI_REVIEWED
                || proposal.getStatus() == ProposalStatus.APPROVED
                || proposal.getStatus() == ProposalStatus.REJECTED) {

            proposal.setStatus(ProposalStatus.REVIEW_REQUESTED);
            proposal.setRejectReason(null);
        }

        return getAdminDetail(proposalId);
    }

    /**
     * AI 검수 실행
     *
     * AI 검수는 REVIEW_REQUESTED 상태에서만 실행한다.
     * AI 검수 자체는 선택 사항이므로 관리자는
     * AI 검수 없이 바로 승인/반려할 수도 있다.
     */
    @Transactional
    public WordProposalDto.AdminDetail executeAiReview(Long proposalId) {
        WordProposal proposal = findProposal(proposalId);

        if (proposal.getStatus() != ProposalStatus.REVIEW_REQUESTED) {
            throw new IllegalStateException(
                    "검수 요청 상태의 제안만 AI 검수를 실행할 수 있습니다."
            );
        }

        aiReviewService.executeReview(proposalId);

        return getAdminDetail(proposalId);
    }

    /**
     * 제안 승인
     *
     * 후보 Word를 선택하는 방식이 아니라
     * 현재 제안 내용을 그대로 실제 Word로 생성한다.
     */
    @Transactional
    public WordDto approve(
            Long proposalId,
            ApproveRequest request
    ) {
        WordProposal proposal = findProposal(proposalId);

        if (proposal.getStatus() != ProposalStatus.REVIEW_REQUESTED
                && proposal.getStatus() != ProposalStatus.AI_REVIEWED) {
            throw new IllegalStateException(
                    "검수 가능한 상태의 제안만 승인할 수 있습니다."
            );
        }

        if (request == null) {
            throw new IllegalArgumentException(
                    "승인 정보를 입력해 주세요."
            );
        }

        String category = required(
                request.category(),
                "카테고리를 입력해 주세요."
        );

        String era = trim(request.era());

        WordDto savedWord = wordService.createFromProposal(
                proposal.getProposedWord(),
                proposal.getMeaning(),
                proposal.getExample(),
                category,
                era
        );

        proposal.setStatus(ProposalStatus.APPROVED);
        proposal.setRejectReason(null);

        return savedWord;
    }

    /**
     * 제안 반려
     *
     * 반려 사유는 선택 사항이다.
     */
    @Transactional
    public WordProposalDto.AdminDetail reject(
            Long proposalId,
            RejectRequest request
    ) {
        WordProposal proposal = findProposal(proposalId);

        if (proposal.getStatus() != ProposalStatus.REVIEW_REQUESTED
                && proposal.getStatus() != ProposalStatus.AI_REVIEWED) {
            throw new IllegalStateException(
                    "검수 가능한 상태의 제안만 반려할 수 있습니다."
            );
        }

        String reason = request == null
                ? null
                : trim(request.reason());

        proposal.setRejectReason(reason);
        proposal.setStatus(ProposalStatus.REJECTED);

        return getAdminDetail(proposalId);
    }

    private WordProposalDto.AdminDetail getAdminDetail(Long proposalId) {
        WordProposal proposal = findProposal(proposalId);

        List<WordProposalDto.Comment> comments =
                commentRepository
                        .findByProposalIdOrderByCreatedAtAsc(proposalId)
                        .stream()
                        .map(WordProposalDto.Comment::new)
                        .toList();

        WordProposalDto.AiReview aiReview =
                reviewRepository.findByProposalId(proposalId)
                        .map(this::convertAiReview)
                        .orElse(null);

        return new WordProposalDto.AdminDetail(
                proposal,
                comments,
                aiReview
        );
    }

    private WordProposalDto.AiReview convertAiReview(
            WordProposalReview review
    ) {
        return new WordProposalDto.AiReview(
                review.getId(),
                new WordProposalDto.ProposalReviewResult(
                        review.getDuplicate(),
                        review.getRecommendedCategory(),
                        review.getRecommendation(),
                        review.getConfidence(),
                        review.getOpinion()
                ),
                new WordProposalDto.SummaryReviewResult(
                        review.getSummaryRecommendation(),
                        review.getSummaryOpinion()
                ),
                review.getCreatedAt(),
                review.getUpdatedAt()
        );
    }

    private WordProposal findProposal(Long proposalId) {
        return proposalRepository.findById(proposalId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "제안을 찾을 수 없습니다."
                        )
                );
    }

    private String required(String value, String message) {
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

        return trimmed.isEmpty() ? null : trimmed;
    }
}
