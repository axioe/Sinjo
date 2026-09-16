package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.WordProposalDto;
import com.slangs.sinjo.entity.ProposalStatus;
import com.slangs.sinjo.entity.User;
import com.slangs.sinjo.entity.WordProposal;
import com.slangs.sinjo.entity.WordProposalComment;
import com.slangs.sinjo.repository.UserRepository;
import com.slangs.sinjo.repository.WordProposalCommentRepository;
import com.slangs.sinjo.repository.WordProposalRepository;
import com.slangs.sinjo.repository.WordProposalVoteRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * REQ-PROP-01(신조어 제안 작성/조회/수정/삭제), REQ-PROP-02(제안 댓글 CRUD),
 * REQ-PROP-04(제안 자동완성 검색).
 */
@ExtendWith(MockitoExtension.class)
class WordProposalServiceTest {

    @Mock private WordProposalRepository proposalRepository;
    @Mock private WordProposalCommentRepository commentRepository;
    @Mock private UserRepository userRepository;
    @Mock private WordProposalVoteRepository voteRepository;

    @InjectMocks
    private WordProposalService wordProposalService;

    private User user(long id) {
        User user = new User();
        user.setId(id);
        return user;
    }

    private WordProposal proposal(long id, long ownerId, ProposalStatus status) {
        WordProposal proposal = new WordProposal();
        ReflectionTestUtils.setField(proposal, "id", id);
        proposal.setUser(user(ownerId));
        proposal.setStatus(status);
        proposal.setProposedWord("혼밥");
        proposal.setMeaning("혼자 밥을 먹는 것");
        proposal.setExample("혼밥 8단계");
        return proposal;
    }

    @Nested
    @DisplayName("REQ-PROP-01: 제안 작성")
    class CreateProposal {

        @Test
        void 단어가_비어있으면_예외() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L)));

            assertThatThrownBy(() -> wordProposalService.createProposal(
                    1L, new WordProposalDto.CreateRequest("", "뜻", "예시", null, null)))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        void 이미_같은_단어가_제안되어_있으면_예외() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L)));
            when(proposalRepository.existsByProposedWord("혼밥")).thenReturn(true);

            assertThatThrownBy(() -> wordProposalService.createProposal(
                    1L, new WordProposalDto.CreateRequest("혼밥", "뜻", "예시", null, null)))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("이미 동일한 단어가 제안되어 있습니다.");
        }

        @Test
        void 정상_작성시_저장된다() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L)));
            when(proposalRepository.existsByProposedWord("혼밥")).thenReturn(false);
            WordProposal saved = proposal(10L, 1L, ProposalStatus.DISCUSSION);
            when(proposalRepository.save(any(WordProposal.class))).thenReturn(saved);
            when(proposalRepository.findById(10L)).thenReturn(Optional.of(saved));
            when(commentRepository.findByProposalIdOrderByCreatedAtAsc(10L)).thenReturn(List.of());

            WordProposalDto.DetailResponse response = wordProposalService.createProposal(
                    1L, new WordProposalDto.CreateRequest("혼밥", "뜻", "예시", null, null));

            assertThat(response.proposedWord()).isEqualTo("혼밥");
        }
    }

    @Nested
    @DisplayName("REQ-PROP-01: 제안 수정/삭제")
    class UpdateDeleteProposal {

        @Test
        void 본인_소유가_아니면_수정시_예외() {
            WordProposal proposal = proposal(10L, 2L, ProposalStatus.DISCUSSION);
            when(proposalRepository.findById(10L)).thenReturn(Optional.of(proposal));

            assertThatThrownBy(() -> wordProposalService.updateProposal(
                    1L, 10L, new WordProposalDto.UpdateRequest("혼밥", "뜻", "예시", null, null)))
                    .isInstanceOf(AccessDeniedException.class);
        }

        @Test
        void 토론중이_아니면_수정시_예외() {
            WordProposal proposal = proposal(10L, 1L, ProposalStatus.REVIEW_REQUESTED);
            when(proposalRepository.findById(10L)).thenReturn(Optional.of(proposal));

            assertThatThrownBy(() -> wordProposalService.updateProposal(
                    1L, 10L, new WordProposalDto.UpdateRequest("혼밥", "뜻", "예시", null, null)))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("토론 중인 제안만 수정할 수 있습니다.");
        }

        @Test
        void 본인_소유가_아니면_삭제시_예외() {
            WordProposal proposal = proposal(10L, 2L, ProposalStatus.DISCUSSION);
            when(proposalRepository.findById(10L)).thenReturn(Optional.of(proposal));

            assertThatThrownBy(() -> wordProposalService.deleteProposal(1L, 10L))
                    .isInstanceOf(AccessDeniedException.class);
        }

        @Test
        void 토론중이_아니면_삭제시_예외() {
            WordProposal proposal = proposal(10L, 1L, ProposalStatus.APPROVED);
            when(proposalRepository.findById(10L)).thenReturn(Optional.of(proposal));

            assertThatThrownBy(() -> wordProposalService.deleteProposal(1L, 10L))
                    .isInstanceOf(IllegalStateException.class);
        }

        @Test
        void 정상_삭제된다() {
            WordProposal proposal = proposal(10L, 1L, ProposalStatus.DISCUSSION);
            when(proposalRepository.findById(10L)).thenReturn(Optional.of(proposal));

            wordProposalService.deleteProposal(1L, 10L);

            verify(proposalRepository).delete(proposal);
        }
    }

    @Nested
    @DisplayName("REQ-PROP-02: 댓글 작성/수정/삭제")
    class Comments {

        @Test
        void 빈_내용이면_작성시_예외() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L)));
            when(proposalRepository.findById(10L))
                    .thenReturn(Optional.of(proposal(10L, 1L, ProposalStatus.DISCUSSION)));

            assertThatThrownBy(() -> wordProposalService.createComment(
                    1L, 10L, new WordProposalDto.CommentRequest("  ")))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        void 정상_작성시_댓글수가_증가한다() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L)));
            WordProposal proposal = proposal(10L, 1L, ProposalStatus.DISCUSSION);
            when(proposalRepository.findById(10L)).thenReturn(Optional.of(proposal));
            when(commentRepository.save(any(WordProposalComment.class))).thenAnswer(inv -> inv.getArgument(0));

            wordProposalService.createComment(1L, 10L, new WordProposalDto.CommentRequest("좋아요"));

            assertThat(proposal.getCommentCount()).isEqualTo(1L);
        }

        @Test
        void 작성자가_아니면_수정시_예외() {
            WordProposalComment comment = new WordProposalComment();
            comment.setUser(user(2L));
            when(commentRepository.findById(100L)).thenReturn(Optional.of(comment));

            assertThatThrownBy(() -> wordProposalService.updateComment(
                    1L, 100L, new WordProposalDto.CommentRequest("수정")))
                    .isInstanceOf(AccessDeniedException.class);
        }

        @Test
        void 작성자가_아니면_삭제시_예외() {
            WordProposalComment comment = new WordProposalComment();
            comment.setUser(user(2L));
            when(commentRepository.findById(100L)).thenReturn(Optional.of(comment));

            assertThatThrownBy(() -> wordProposalService.deleteComment(1L, 100L))
                    .isInstanceOf(AccessDeniedException.class);
        }

        @Test
        void 정상_삭제시_댓글수가_감소한다() {
            WordProposal proposal = proposal(10L, 1L, ProposalStatus.DISCUSSION);
            proposal.increaseCommentCount();
            WordProposalComment comment = new WordProposalComment();
            comment.setUser(user(1L));
            comment.setProposal(proposal);
            when(commentRepository.findById(100L)).thenReturn(Optional.of(comment));

            wordProposalService.deleteComment(1L, 100L);

            assertThat(proposal.getCommentCount()).isEqualTo(0L);
        }
    }

    @Nested
    @DisplayName("REQ-PROP-04: 자동완성 검색")
    class Suggestions {

        @Test
        void 빈_키워드면_빈_목록을_돌려준다() {
            assertThat(wordProposalService.getSuggestions("")).isEmpty();
            assertThat(wordProposalService.getSuggestions(null)).isEmpty();
        }

        @Test
        void 키워드가_있으면_저장소에_위임한다() {
            when(proposalRepository.findSuggestions(eq("혼"), any()))
                    .thenReturn(List.of("혼밥", "혼코노"));

            List<String> result = wordProposalService.getSuggestions("혼");

            assertThat(result).containsExactly("혼밥", "혼코노");
        }
    }
}
