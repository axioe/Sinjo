package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.WordProposalDto;
import com.slangs.sinjo.entity.*;
import com.slangs.sinjo.exception.DuplicateWordException;
import com.slangs.sinjo.exception.NotFoundException;
import com.slangs.sinjo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 신조어 제안 / 토의 서비스
  * 사용자
 *   ↓
 * WordProposal
 *   ↓
 * 댓글 토의
 *   ↓
 * 새로운 후보 Word
 *   ↓
 * 관리자 검수 요청
 *   ↓
 * AI 검수
 *   ↓
 * 관리자 승인
 */
@Service
@RequiredArgsConstructor
public class WordProposalService {

    private final WordProposalRepository proposalRepository;
    private final WordProposalCommentRepository commentRepository;
    private final WordProposalCandidateRepository candidateRepository;
    private final UserRepository userRepository;
    private final WordProposalReviewRepository reviewRepository;

    // =========================================================
    // 제안글
    // =========================================================

    /**
     * 제안글 목록
     */
    @Transactional(readOnly = true)
    public List<WordProposalDto.ListResponse> getProposals() {

        return proposalRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(WordProposalDto.ListResponse::from)
                .toList();
    }


    /**
     * 제안글 상세
     * 상세 페이지 진입 시 조회수 +1
     */
    @Transactional
    public WordProposalDto.DetailResponse getProposal(Long proposalId) {

        WordProposal proposal = findProposal(proposalId);

        proposal.increaseView();

        List<WordProposalDto.CommentResponse> comments = getComments(proposalId);

        List<WordProposalDto.CandidateResponse> candidates = getCandidates(proposalId);

        return WordProposalDto.DetailResponse.from(
                proposal,
                comments,
                candidates,
                null
        );
    }


    /**
     * 제안글 등록
     */
    @Transactional
    public WordProposalDto.DetailResponse createProposal(
            Long userId,
            WordProposalDto.CreateRequest request
    ) {

        User user = findUser(userId);

        String proposedWord = required(
                request.proposedWord(),
                "제안할 신조어를 입력해 주세요."
        );

        String meaning = required(
                request.meaning(),
                "어떤 의미인지 입력해 주세요."
        );

        String example = required(
                request.example(),
                "어떻게 사용하나요? 사용 예시를 입력해 주세요."
        );

        /*
         * 동일한 WordProposal이 이미 존재하는 경우
         */
        if (proposalRepository.existsByProposedWord(proposedWord)) {
            throw new DuplicateWordException(proposedWord);
        }

        WordProposal proposal = new WordProposal();

        proposal.setProposedWord(proposedWord);
        proposal.setMeaning(meaning);
        proposal.setExample(example);

        proposal.setDescription(
                trim(request.description())
        );

        proposal.setSourceDescription(
                trim(request.sourceDescription())
        );

        proposal.setUser(user);
        proposal.setStatus(ProposalStatus.DISCUSSION);

        WordProposal saved =
                proposalRepository.save(proposal);

        return WordProposalDto.DetailResponse.from(
                saved,
                List.of(),
                List.of(),
                null
        );
    }


    /**
     * 제안글 수정
     */
    @Transactional
    public WordProposalDto.DetailResponse updateProposal(
            Long userId,
            Long proposalId,
            WordProposalDto.UpdateRequest request
    ) {

        WordProposal proposal =
                findProposal(proposalId);

        checkOwner(userId, proposal);

        /*
         * 토의가 시작된 제안은 관리자 검수 요청 이후
         * 내용을 변경하지 못하도록 한다.
         */
        if (proposal.getStatus() != ProposalStatus.DISCUSSION) {

            throw new IllegalStateException(
                    "토의 중인 제안만 수정할 수 있습니다."
            );
        }

        String proposedWord = required(
                request.proposedWord(),
                "제안할 신조어를 입력해 주세요."
        );

        String meaning = required(
                request.meaning(),
                "어떤 의미인지 입력해 주세요."
        );

        String example = required(
                request.example(),
                "어떻게 사용하나요? 사용 예시를 입력해 주세요."
        );

        if (!proposal.getProposedWord().equals(proposedWord)
                && proposalRepository.existsByProposedWord(proposedWord)) {

            throw new DuplicateWordException(proposedWord);
        }

        proposal.setProposedWord(proposedWord);
        proposal.setMeaning(meaning);
        proposal.setExample(example);

        proposal.setDescription(
                trim(request.description())
        );

        proposal.setSourceDescription(
                trim(request.sourceDescription())
        );

        return getDetailWithoutViewIncrease(proposal);
    }


    /**
     * 제안글 삭제
     */
    @Transactional
    public void deleteProposal(
            Long userId,
            Long proposalId
    ) {

        WordProposal proposal =
                findProposal(proposalId);

        checkOwner(userId, proposal);

        if (proposal.getStatus() != ProposalStatus.DISCUSSION) {

            throw new IllegalStateException(
                    "토의 중인 제안만 삭제할 수 있습니다."
            );
        }

        proposalRepository.delete(proposal);
    }


    // =========================================================
    // 댓글
    // =========================================================

    /**
     * 댓글 목록
     *
     * 일반 댓글
     *   └── 대댓글
     */
    @Transactional(readOnly = true)
    public List<WordProposalDto.CommentResponse> getComments(
            Long proposalId
    ) {

        /*
         * 존재하지 않는 제안에 댓글 조회를 하지 못하게 한다.
         */
        findProposal(proposalId);

        List<WordProposalComment> comments =
                commentRepository
                        .findByProposalIdAndParentIsNullOrderByCreatedAtAsc(
                                proposalId
                        );

        return comments.stream()
                .map(comment -> {
                    List<WordProposalDto.CommentResponse> replies =
                            commentRepository
                                    .findByParentIdOrderByCreatedAtAsc(
                                            comment.getId()
                                    )
                                    .stream()
                                    .map(reply ->
                                            WordProposalDto.CommentResponse
                                                    .from(reply, List.of())
                                    )
                                    .toList();

                    return WordProposalDto.CommentResponse.from(comment, replies);
                })
                .toList();
    }


    /**
     * 댓글 작성
     */
    @Transactional
    public WordProposalDto.CommentResponse createComment(
            Long userId,
            Long proposalId,
            WordProposalDto.CommentRequest request
    ) {

        User user = findUser(userId);

        WordProposal proposal =
                findProposal(proposalId);

        String content =
                required(
                        request.content(),
                        "댓글 내용을 입력해 주세요."
                );

        WordProposalComment comment =
                new WordProposalComment();

        comment.setProposal(proposal);
        comment.setUser(user);
        comment.setContent(content);

        WordProposalComment saved =
                commentRepository.save(comment);

        proposal.increaseCommentCount();

        return WordProposalDto.CommentResponse.from(
                saved,
                List.of()
        );
    }


    /**
     * 대댓글 작성
     */
    @Transactional
    public WordProposalDto.CommentResponse createReply(
            Long userId,
            Long proposalId,
            Long parentId,
            WordProposalDto.CommentRequest request
    ) {

        User user = findUser(userId);

        WordProposal proposal =
                findProposal(proposalId);

        WordProposalComment parent =
                commentRepository.findById(parentId)
                        .orElseThrow(() ->
                                new NotFoundException(
                                        "부모 댓글을 찾을 수 없습니다."
                                )
                        );

        if (!parent.getProposal()
                .getId()
                .equals(proposalId)) {

            throw new IllegalArgumentException(
                    "해당 제안글의 댓글이 아닙니다."
            );
        }

        String content =
                required(
                        request.content(),
                        "댓글 내용을 입력해 주세요."
                );

        WordProposalComment reply =
                new WordProposalComment();

        reply.setProposal(proposal);
        reply.setUser(user);
        reply.setParent(parent);
        reply.setContent(content);

        WordProposalComment saved =
                commentRepository.save(reply);

        proposal.increaseCommentCount();

        return WordProposalDto.CommentResponse.from(
                saved,
                List.of()
        );
    }


    /**
     * 댓글 수정
     */
    @Transactional
    public WordProposalDto.CommentResponse updateComment(
            Long userId,
            Long commentId,
            WordProposalDto.CommentRequest request
    ) {

        WordProposalComment comment =
                commentRepository.findById(commentId)
                        .orElseThrow(() ->
                                new NotFoundException(
                                        "댓글을 찾을 수 없습니다."
                                )
                        );

        if (userId == null) {
            throw new AccessDeniedException(
                    "로그인이 필요합니다."
            );
        }

        if (comment.getUser() == null
                || !comment.getUser().getId().equals(userId)) {

            throw new AccessDeniedException(
                    "본인이 작성한 댓글만 수정할 수 있습니다."
            );
        }

        String content =
                required(
                        request.content(),
                        "댓글 내용을 입력해 주세요."
                );

        comment.updateContent(content);

        return WordProposalDto.CommentResponse.from(
                comment,
                List.of()
        );
    }


    /**
     * 댓글 삭제
     */
    @Transactional
    public void deleteComment(
            Long userId,
            Long commentId
    ) {

        WordProposalComment comment =
                commentRepository.findById(commentId)
                        .orElseThrow(() ->
                                new NotFoundException(
                                        "댓글을 찾을 수 없습니다."
                                )
                        );

        if (userId == null) {
            throw new AccessDeniedException(
                    "로그인이 필요합니다."
            );
        }

        if (comment.getUser() == null
                || !comment.getUser().getId().equals(userId)) {

            throw new AccessDeniedException(
                    "본인이 작성한 댓글만 삭제할 수 있습니다."
            );
        }

        WordProposal proposal =
                comment.getProposal();

        proposal.decreaseCommentCount();

        commentRepository.delete(comment);
    }


    // =========================================================
    // 후보 Word
    // =========================================================

    /**
     * 후보 Word 목록
     */
    @Transactional(readOnly = true)
    public List<WordProposalDto.CandidateResponse> getCandidates(
            Long proposalId
    ) {

        findProposal(proposalId);

        return candidateRepository
                .findByProposalIdOrderByLikesDescCreatedAtAsc(
                        proposalId
                )
                .stream()
                .map(WordProposalDto.CandidateResponse::from)
                .toList();
    }


    /**
     * 후보 Word 등록
     *
     * 댓글에서 발견한 새로운 신조어를
     * 별도의 후보 Word로 등록할 수 있다.
     */
    @Transactional
    public WordProposalDto.CandidateResponse createCandidate(
            Long userId,
            Long proposalId,
            Long commentId,
            WordProposalDto.CandidateRequest request
    ) {

        User user = findUser(userId);

        WordProposal proposal =
                findProposal(proposalId);

        String word =
                required(
                        request.word(),
                        "후보 신조어를 입력해 주세요."
                );

        String meaning =
                required(
                        request.meaning(),
                        "후보 신조어의 의미를 입력해 주세요."
                );

        String example =
                required(
                        request.example(),
                        "후보 신조어의 사용 예시를 입력해 주세요."
                );

        if (candidateRepository
                .existsByProposalIdAndWord(
                        proposalId,
                        word
                )) {

            throw new DuplicateWordException(word);
        }

        WordProposalComment comment = null;

        if (commentId != null) {

            comment =
                    commentRepository.findById(commentId)
                            .orElseThrow(() ->
                                    new NotFoundException(
                                            "댓글을 찾을 수 없습니다."
                                    )
                            );

            if (!comment.getProposal()
                    .getId()
                    .equals(proposalId)) {

                throw new IllegalArgumentException(
                        "해당 제안글의 댓글이 아닙니다."
                );
            }
        }

        WordProposalCandidate candidate =
                new WordProposalCandidate();

        candidate.setProposal(proposal);
        candidate.setComment(comment);
        candidate.setUser(user);
        candidate.setWord(word);
        candidate.setMeaning(meaning);
        candidate.setExample(example);

        candidate.setDescription(
                trim(request.description())
        );

        candidate.setStatus(
                CandidateStatus.PENDING
        );

        WordProposalCandidate saved =
                candidateRepository.save(candidate);

        return WordProposalDto.CandidateResponse.from(
                saved
        );
    }


    // =========================================================
    // 내부 메서드
    // =========================================================

    private WordProposal findProposal(Long id) {

        return proposalRepository.findById(id)
                .orElseThrow(() ->
                        new NotFoundException(
                                "신조어 제안을 찾을 수 없습니다."
                        )
                );
    }


    private User findUser(Long userId) {

        if (userId == null) {

            throw new IllegalArgumentException(
                    "로그인이 필요합니다."
            );
        }

        return userRepository.findById(userId)
                .orElseThrow(() ->
                        new NotFoundException(
                                "사용자를 찾을 수 없습니다."
                        )
                );
    }


    private void checkOwner(
            Long userId,
            WordProposal proposal
    ) {
        if (userId == null) {
            throw new AccessDeniedException(
                    "로그인이 필요합니다."
            );
        }

        if (proposal.getUser() == null
                || !proposal.getUser().getId().equals(userId)) {

            throw new AccessDeniedException(
                    "본인이 작성한 제안만 수정하거나 삭제할 수 있습니다."
            );
        }
    }

    private WordProposalDto.DetailResponse
    getDetailWithoutViewIncrease(
            WordProposal proposal
    ) {

        return WordProposalDto.DetailResponse.from(
                proposal,
                getComments(proposal.getId()),
                getCandidates(proposal.getId()),
                null
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
