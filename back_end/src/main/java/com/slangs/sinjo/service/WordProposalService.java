package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.WordProposalDto;
import com.slangs.sinjo.entity.User;
import com.slangs.sinjo.entity.WordProposal;
import com.slangs.sinjo.entity.WordProposalComment;
import com.slangs.sinjo.exception.NotFoundException;
import com.slangs.sinjo.repository.UserRepository;
import com.slangs.sinjo.repository.WordProposalCommentRepository;
import com.slangs.sinjo.repository.WordProposalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WordProposalService {

    private final WordProposalRepository proposalRepository;
    private final WordProposalCommentRepository commentRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<WordProposalDto.ListResponse> getProposals() {
        return proposalRepository
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .map(WordProposalDto.ListResponse::from)
                .toList();
    }

    @Transactional
    public WordProposalDto.DetailResponse getProposal(
            Long userId,
            Long proposalId
    ) {
        WordProposal proposal = findProposal(proposalId);
        proposal.increaseView();

        List<WordProposalDto.CommentResponse> comments =
                commentRepository
                        .findByProposalIdOrderByCreatedAtAsc(proposalId)
                        .stream()
                        .map(WordProposalDto.CommentResponse::from)
                        .toList();

        // AI 검수와 투표 처리는 각각 별도 기능에서 담당합니다.
        return WordProposalDto.DetailResponse.from(
                proposal,
                comments,
                null,
                null
        );
    }

    @Transactional
    public WordProposalDto.DetailResponse createProposal(
            Long userId,
            WordProposalDto.CreateRequest request
    ) {
        User user = findUser(userId);

        if (request == null) {
            throw new IllegalArgumentException("제안 내용을 입력해 주세요.");
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

        if (proposalRepository.existsByProposedWord(proposedWord)) {
            throw new IllegalArgumentException(
                    "이미 동일한 단어가 제안되어 있습니다."
            );
        }

        WordProposal proposal = new WordProposal();
        proposal.setProposedWord(proposedWord);
        proposal.setMeaning(meaning);
        proposal.setExample(example);
        proposal.setDescription(trim(request.description()));
        proposal.setSourceDescription(trim(request.sourceDescription()));
        proposal.setUser(user);

        WordProposal savedProposal = proposalRepository.save(proposal);

        return getDetailWithoutViewIncrease(
                userId,
                savedProposal.getId()
        );
    }

    @Transactional
    public WordProposalDto.DetailResponse updateProposal(
            Long userId,
            Long proposalId,
            WordProposalDto.UpdateRequest request
    ) {
        WordProposal proposal = findProposal(proposalId);
        checkProposalOwner(proposal, userId);

        if (proposal.getStatus()
                != com.slangs.sinjo.entity.ProposalStatus.DISCUSSION) {
            throw new IllegalStateException(
                    "토론 중인 제안만 수정할 수 있습니다."
            );
        }

        if (request == null) {
            throw new IllegalArgumentException(
                    "수정 내용을 입력해 주세요."
            );
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

        proposal.setProposedWord(proposedWord);
        proposal.setMeaning(meaning);
        proposal.setExample(example);
        proposal.setDescription(trim(request.description()));
        proposal.setSourceDescription(trim(request.sourceDescription()));

        return getDetailWithoutViewIncrease(userId, proposalId);
    }

    @Transactional
    public void deleteProposal(Long userId, Long proposalId) {
        WordProposal proposal = findProposal(proposalId);
        checkProposalOwner(proposal, userId);

        if (proposal.getStatus()
                != com.slangs.sinjo.entity.ProposalStatus.DISCUSSION) {
            throw new IllegalStateException(
                    "토론 중인 제안만 삭제할 수 있습니다."
            );
        }

        proposalRepository.delete(proposal);
    }

    @Transactional(readOnly = true)
    public List<WordProposalDto.CommentResponse> getComments(Long proposalId) {
        findProposal(proposalId);

        return commentRepository
                .findByProposalIdOrderByCreatedAtAsc(proposalId)
                .stream()
                .map(WordProposalDto.CommentResponse::from)
                .toList();
    }

    @Transactional
    public WordProposalDto.CommentResponse createComment(
            Long userId,
            Long proposalId,
            WordProposalDto.CommentRequest request
    ) {
        User user = findUser(userId);
        WordProposal proposal = findProposal(proposalId);

        if (request == null
                || request.content() == null
                || request.content().isBlank()) {
            throw new IllegalArgumentException("댓글 내용을 입력해 주세요.");
        }

        WordProposalComment comment = new WordProposalComment();
        comment.setProposal(proposal);
        comment.setUser(user);
        comment.setContent(request.content().trim());

        WordProposalComment savedComment = commentRepository.save(comment);
        proposal.increaseCommentCount();

        return WordProposalDto.CommentResponse.from(savedComment);
    }

    @Transactional
    public WordProposalDto.CommentResponse updateComment(
            Long userId,
            Long commentId,
            WordProposalDto.CommentRequest request
    ) {
        WordProposalComment comment = findComment(commentId);
        checkCommentOwner(comment, userId);

        if (request == null
                || request.content() == null
                || request.content().isBlank()) {
            throw new IllegalArgumentException("댓글 내용을 입력해 주세요.");
        }

        comment.updateContent(request.content().trim());

        return WordProposalDto.CommentResponse.from(comment);
    }

    @Transactional
    public void deleteComment(Long userId, Long commentId) {
        WordProposalComment comment = findComment(commentId);
        checkCommentOwner(comment, userId);

        WordProposal proposal = comment.getProposal();
        commentRepository.delete(comment);
        proposal.decreaseCommentCount();
    }

    private WordProposalDto.DetailResponse getDetailWithoutViewIncrease(
            Long userId,
            Long proposalId
    ) {
        WordProposal proposal = findProposal(proposalId);

        List<WordProposalDto.CommentResponse> comments =
                commentRepository
                        .findByProposalIdOrderByCreatedAtAsc(proposalId)
                        .stream()
                        .map(WordProposalDto.CommentResponse::from)
                        .toList();

        return WordProposalDto.DetailResponse.from(
                proposal,
                comments,
                null,
                null
        );
    }

    private WordProposal findProposal(Long proposalId) {
        return proposalRepository.findById(proposalId)
                .orElseThrow(() ->
                        new NotFoundException("제안을 찾을 수 없습니다.")
                );
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() ->
                        new NotFoundException("사용자를 찾을 수 없습니다.")
                );
    }

    private WordProposalComment findComment(Long commentId) {
        return commentRepository.findById(commentId)
                .orElseThrow(() ->
                        new NotFoundException("댓글을 찾을 수 없습니다.")
                );
    }

    private void checkProposalOwner(
            WordProposal proposal,
            Long userId
    ) {
        if (!proposal.getUser().getId().equals(userId)) {
            throw new AccessDeniedException(
                    "본인이 작성한 제안만 수정하거나 삭제할 수 있습니다."
            );
        }
    }

    private void checkCommentOwner(
            WordProposalComment comment,
            Long userId
    ) {
        if (!comment.getUser().getId().equals(userId)) {
            throw new AccessDeniedException(
                    "본인이 작성한 댓글만 수정하거나 삭제할 수 있습니다."
            );
        }
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
