package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.WordProposalDto;
import com.slangs.sinjo.entity.User;
import com.slangs.sinjo.entity.VoteType;
import com.slangs.sinjo.entity.WordProposal;
import com.slangs.sinjo.entity.WordProposalVote;
import com.slangs.sinjo.exception.NotFoundException;
import com.slangs.sinjo.repository.UserRepository;
import com.slangs.sinjo.repository.WordProposalRepository;
import com.slangs.sinjo.repository.WordProposalVoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class WordProposalVoteService {

    private final WordProposalRepository proposalRepository;
    private final WordProposalVoteRepository voteRepository;
    private final UserRepository userRepository;

    @Value("${proposal.review.like-threshold:3}")
    private long likeThreshold;

    @Transactional
    public WordProposalDto.VoteResponse vote(
            Long userId,
            Long proposalId,
            WordProposalDto.VoteRequest request
    ) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("사용자를 찾을 수 없습니다."));

        WordProposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new NotFoundException("제안을 찾을 수 없습니다."));

        if (proposal.getUser().getId().equals(userId)) {
            throw new AccessDeniedException(
                    "본인이 작성한 제안에는 투표할 수 없습니다."
            );
        }

        if (proposal.getStatus() != com.slangs.sinjo.entity.ProposalStatus.DISCUSSION) {
            throw new IllegalStateException(
                    "토론 중인 제안에만 투표할 수 있습니다."
            );
        }

        if (request == null
                || request.type() == null
                || request.type().isBlank()) {
            throw new IllegalArgumentException("투표 유형을 선택해 주세요.");
        }

        if (voteRepository.existsByProposalIdAndUserId(
                proposalId,
                userId
        )) {
            throw new IllegalStateException("이미 투표한 제안입니다.");
        }

        VoteType voteType;
        try {
            voteType = VoteType.valueOf(
                    request.type().trim().toUpperCase()
            );
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                    "LIKE 또는 DISLIKE만 선택할 수 있습니다."
            );
        }

        WordProposalVote vote = new WordProposalVote();
        vote.setProposal(proposal);
        vote.setUser(user);
        vote.setType(voteType);
        voteRepository.save(vote);

        if (voteType == VoteType.LIKE) {
            proposal.increaseLike();

            if (proposal.getStatus()
                    == com.slangs.sinjo.entity.ProposalStatus.DISCUSSION
                    && proposal.getLikes() >= likeThreshold) {
                proposal.setStatus(
                        com.slangs.sinjo.entity.ProposalStatus.REVIEW_REQUESTED
                );
            }
        } else {
            proposal.increaseDislike();
        }

        return new WordProposalDto.VoteResponse(
                proposal.getId(),
                proposal.getLikes(),
                proposal.getDislikes(),
                voteType.name(),
                proposal.getStatus().name()
        );
    }
}
