package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.ApproveRequest;
import com.slangs.sinjo.dto.RejectRequest;
import com.slangs.sinjo.dto.WordDto;
import com.slangs.sinjo.dto.WordProposalDto;
import com.slangs.sinjo.entity.ProposalStatus;
import com.slangs.sinjo.entity.User;
import com.slangs.sinjo.entity.WordProposal;
import com.slangs.sinjo.repository.WordProposalCommentRepository;
import com.slangs.sinjo.repository.WordProposalRepository;
import com.slangs.sinjo.repository.WordProposalReviewRepository;
import com.slangs.sinjo.repository.WordProposalVoteRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * REQ-PROP-05(관리자 AI 검수 실행), REQ-PROP-06(관리자 제안 승인/반려),
 * REQ-ADMIN-06(신조어 제작소 관리 - 목록/상세/수정/삭제).
 */
@ExtendWith(MockitoExtension.class)
class WordProposalAdminServiceTest {

    @Mock private WordProposalRepository proposalRepository;
    @Mock private WordProposalCommentRepository commentRepository;
    @Mock private WordProposalReviewRepository reviewRepository;
    @Mock private WordService wordService;
    @Mock private WordProposalAiReviewService aiReviewService;
    @Mock private WordProposalVoteRepository voteRepository;

    @InjectMocks
    private WordProposalAdminService adminProposalService;

    private WordProposal proposal(ProposalStatus status) {
        WordProposal proposal = new WordProposal();
        User user = new User();
        user.setId(1L);
        proposal.setUser(user);
        proposal.setStatus(status);
        proposal.setProposedWord("혼밥");
        proposal.setMeaning("혼자 밥을 먹는 것");
        proposal.setExample("혼밥 8단계");
        return proposal;
    }

    private void stubDetailLookup(WordProposal proposal) {
        when(proposalRepository.findById(10L)).thenReturn(Optional.of(proposal));
        when(commentRepository.findByProposalIdOrderByCreatedAtAsc(10L)).thenReturn(List.of());
        when(reviewRepository.findByProposalId(10L)).thenReturn(Optional.empty());
    }

    @Nested
    @DisplayName("REQ-PROP-05: 관리자 AI 검수 실행")
    class ExecuteAiReview {

        @Test
        void 검수요청_상태가_아니면_예외() {
            when(proposalRepository.findById(10L)).thenReturn(Optional.of(proposal(ProposalStatus.DISCUSSION)));

            assertThatThrownBy(() -> adminProposalService.executeAiReview(10L))
                    .isInstanceOf(IllegalStateException.class);
        }

        @Test
        void 검수요청_상태면_AI_검수_서비스에_위임된다() {
            WordProposal proposal = proposal(ProposalStatus.REVIEW_REQUESTED);
            stubDetailLookup(proposal);

            adminProposalService.executeAiReview(10L);

            verify(aiReviewService).executeReview(10L);
        }
    }

    @Nested
    @DisplayName("REQ-PROP-06: 관리자 제안 승인")
    class Approve {

        @Test
        void 검수_가능한_상태가_아니면_예외() {
            when(proposalRepository.findById(10L)).thenReturn(Optional.of(proposal(ProposalStatus.DISCUSSION)));

            assertThatThrownBy(() -> adminProposalService.approve(10L, new ApproveRequest("일상", null)))
                    .isInstanceOf(IllegalStateException.class);
        }

        @Test
        void 카테고리가_없으면_예외() {
            when(proposalRepository.findById(10L)).thenReturn(Optional.of(proposal(ProposalStatus.REVIEW_REQUESTED)));

            assertThatThrownBy(() -> adminProposalService.approve(10L, new ApproveRequest("", null)))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        void 정상_승인시_실제_Word가_생성되고_상태가_바뀐다() {
            WordProposal proposal = proposal(ProposalStatus.AI_REVIEWED);
            when(proposalRepository.findById(10L)).thenReturn(Optional.of(proposal));
            WordDto wordDto = new WordDto(new com.slangs.sinjo.entity.Word("혼밥", "뜻", "예문", "일상", null));
            when(wordService.createFromProposal("혼밥", "혼자 밥을 먹는 것", "혼밥 8단계", "일상", null))
                    .thenReturn(wordDto);

            WordDto result = adminProposalService.approve(10L, new ApproveRequest("일상", null));

            assertThat(result.getWord()).isEqualTo("혼밥");
            assertThat(proposal.getStatus()).isEqualTo(ProposalStatus.APPROVED);
        }
    }

    @Nested
    @DisplayName("REQ-PROP-06: 관리자 제안 반려")
    class Reject {

        @Test
        void 검수_가능한_상태가_아니면_예외() {
            when(proposalRepository.findById(10L)).thenReturn(Optional.of(proposal(ProposalStatus.APPROVED)));

            assertThatThrownBy(() -> adminProposalService.reject(10L, new RejectRequest("사유")))
                    .isInstanceOf(IllegalStateException.class);
        }

        @Test
        void 정상_반려시_사유가_저장되고_상태가_바뀐다() {
            WordProposal proposal = proposal(ProposalStatus.REVIEW_REQUESTED);
            stubDetailLookup(proposal);

            adminProposalService.reject(10L, new RejectRequest("이미 널리 쓰이는 표현"));

            assertThat(proposal.getStatus()).isEqualTo(ProposalStatus.REJECTED);
            assertThat(proposal.getRejectReason()).isEqualTo("이미 널리 쓰이는 표현");
        }
    }

    @Nested
    @DisplayName("REQ-ADMIN-06: 관리자 제안 수정")
    class AdminUpdate {

        @Test
        void 검수완료_상태를_수정하면_다시_검수요청_상태로_돌아간다() {
            WordProposal proposal = proposal(ProposalStatus.AI_REVIEWED);
            proposal.setRejectReason("이전 반려 사유");
            stubDetailLookup(proposal);

            adminProposalService.updateProposal(10L, new WordProposalDto.AdminUpdateRequest(
                    "혼밥러", "수정된 뜻", "수정된 예시", null, null));

            assertThat(proposal.getStatus()).isEqualTo(ProposalStatus.REVIEW_REQUESTED);
            assertThat(proposal.getRejectReason()).isNull();
            verify(reviewRepository, never()).delete(any());
        }

        @Test
        void 토론중_상태를_수정하면_상태는_그대로_유지된다() {
            WordProposal proposal = proposal(ProposalStatus.DISCUSSION);
            stubDetailLookup(proposal);

            adminProposalService.updateProposal(10L, new WordProposalDto.AdminUpdateRequest(
                    "혼밥러", "수정된 뜻", "수정된 예시", null, null));

            assertThat(proposal.getStatus()).isEqualTo(ProposalStatus.DISCUSSION);
        }
    }

    @Nested
    @DisplayName("REQ-ADMIN-06: 관리자 제안 삭제")
    class AdminDelete {

        @Test
        void 삭제_전에_연관_데이터를_순서대로_지운다() {
            WordProposal proposal = proposal(ProposalStatus.DISCUSSION);
            when(proposalRepository.findById(10L)).thenReturn(Optional.of(proposal));
            when(reviewRepository.findByProposalId(10L)).thenReturn(Optional.empty());

            adminProposalService.deleteProposal(10L);

            verify(voteRepository).deleteByProposalId(10L);
            verify(commentRepository).deleteByProposalId(10L);
            verify(proposalRepository).delete(proposal);
        }
    }
}
