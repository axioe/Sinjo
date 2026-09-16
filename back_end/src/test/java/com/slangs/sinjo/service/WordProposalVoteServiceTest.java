package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.WordProposalDto;
import com.slangs.sinjo.entity.ProposalStatus;
import com.slangs.sinjo.entity.User;
import com.slangs.sinjo.entity.WordProposal;
import com.slangs.sinjo.exception.NotFoundException;
import com.slangs.sinjo.repository.UserRepository;
import com.slangs.sinjo.repository.WordProposalRepository;
import com.slangs.sinjo.repository.WordProposalVoteRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

/**
 * REQ-PROP-03: 신조어 제안 투표.
 * <p>
 * likeThreshold 는 실제 애플리케이션 기본값(3)과 동일하게 맞춘다 - @Value 필드라
 * Mockito 단위 테스트에서는 스프링이 주입해 주지 않으므로 리플렉션으로 직접 설정한다.
 */
@ExtendWith(MockitoExtension.class)
class WordProposalVoteServiceTest {

    private static final long LIKE_THRESHOLD = 3L;

    @Mock private WordProposalRepository proposalRepository;
    @Mock private WordProposalVoteRepository voteRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private WordProposalVoteService voteService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(voteService, "likeThreshold", LIKE_THRESHOLD);
    }

    private User user(long id) {
        User user = new User();
        user.setId(id);
        return user;
    }

    private WordProposal proposal(long ownerId, ProposalStatus status, long likes) {
        WordProposal proposal = new WordProposal();
        proposal.setUser(user(ownerId));
        proposal.setStatus(status);
        for (int i = 0; i < likes; i++) {
            proposal.increaseLike();
        }
        return proposal;
    }

    @Nested
    @DisplayName("REQ-PROP-03: 투표 제한")
    class VoteRestrictions {

        @Test
        void 본인이_작성한_제안에는_투표할_수_없다() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L)));
            when(proposalRepository.findById(10L)).thenReturn(Optional.of(proposal(1L, ProposalStatus.DISCUSSION, 0)));

            assertThatThrownBy(() -> voteService.vote(1L, 10L, new WordProposalDto.VoteRequest("LIKE")))
                    .isInstanceOf(AccessDeniedException.class);
        }

        @Test
        void 토론중이_아니면_투표할_수_없다() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L)));
            when(proposalRepository.findById(10L))
                    .thenReturn(Optional.of(proposal(2L, ProposalStatus.REVIEW_REQUESTED, 0)));

            assertThatThrownBy(() -> voteService.vote(1L, 10L, new WordProposalDto.VoteRequest("LIKE")))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("토론 중인 제안에만 투표할 수 있습니다.");
        }

        @Test
        void 존재하지_않는_사용자면_예외() {
            when(userRepository.findById(1L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> voteService.vote(1L, 10L, new WordProposalDto.VoteRequest("LIKE")))
                    .isInstanceOf(NotFoundException.class);
        }

        @Test
        void 이미_투표한_제안이면_예외() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L)));
            when(proposalRepository.findById(10L)).thenReturn(Optional.of(proposal(2L, ProposalStatus.DISCUSSION, 0)));
            when(voteRepository.existsByProposalIdAndUserId(10L, 1L)).thenReturn(true);

            assertThatThrownBy(() -> voteService.vote(1L, 10L, new WordProposalDto.VoteRequest("LIKE")))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessage("이미 투표한 제안입니다.");
        }

        @Test
        void 잘못된_투표_유형이면_예외() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L)));
            when(proposalRepository.findById(10L)).thenReturn(Optional.of(proposal(2L, ProposalStatus.DISCUSSION, 0)));

            assertThatThrownBy(() -> voteService.vote(1L, 10L, new WordProposalDto.VoteRequest("GOOD")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("LIKE 또는 DISLIKE만 선택할 수 있습니다.");
        }
    }

    @Nested
    @DisplayName("REQ-PROP-03: 정상 투표 처리")
    class VoteProcessing {

        @Test
        void 좋아요_투표시_좋아요수가_증가한다() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L)));
            WordProposal proposal = proposal(2L, ProposalStatus.DISCUSSION, 0);
            when(proposalRepository.findById(10L)).thenReturn(Optional.of(proposal));

            WordProposalDto.VoteResponse response = voteService.vote(1L, 10L, new WordProposalDto.VoteRequest("like"));

            assertThat(response.likes()).isEqualTo(1L);
            assertThat(response.status()).isEqualTo(ProposalStatus.DISCUSSION.name());
        }

        @Test
        void 싫어요_투표시_싫어요수만_증가하고_상태는_그대로다() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L)));
            WordProposal proposal = proposal(2L, ProposalStatus.DISCUSSION, 0);
            when(proposalRepository.findById(10L)).thenReturn(Optional.of(proposal));

            WordProposalDto.VoteResponse response = voteService.vote(1L, 10L, new WordProposalDto.VoteRequest("DISLIKE"));

            assertThat(response.dislikes()).isEqualTo(1L);
            assertThat(response.likes()).isZero();
            assertThat(response.status()).isEqualTo(ProposalStatus.DISCUSSION.name());
        }

        @Test
        void 좋아요가_기준치에_도달하면_검수요청_상태로_바뀐다() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L)));
            // 이미 좋아요 2개 - 이번 투표로 임계값(3)에 도달한다.
            WordProposal proposal = proposal(2L, ProposalStatus.DISCUSSION, LIKE_THRESHOLD - 1);
            when(proposalRepository.findById(10L)).thenReturn(Optional.of(proposal));

            WordProposalDto.VoteResponse response = voteService.vote(1L, 10L, new WordProposalDto.VoteRequest("LIKE"));

            assertThat(response.likes()).isEqualTo(LIKE_THRESHOLD);
            assertThat(response.status()).isEqualTo(ProposalStatus.REVIEW_REQUESTED.name());
        }

        @Test
        void 기준치_미달이면_상태가_그대로_유지된다() {
            when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L)));
            WordProposal proposal = proposal(2L, ProposalStatus.DISCUSSION, LIKE_THRESHOLD - 2);
            when(proposalRepository.findById(10L)).thenReturn(Optional.of(proposal));

            WordProposalDto.VoteResponse response = voteService.vote(1L, 10L, new WordProposalDto.VoteRequest("LIKE"));

            assertThat(response.status()).isEqualTo(ProposalStatus.DISCUSSION.name());
        }
    }
}
