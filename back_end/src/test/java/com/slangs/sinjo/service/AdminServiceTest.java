package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.AdminDto;
import com.slangs.sinjo.dto.QuizWordDto;
import com.slangs.sinjo.dto.UserDto;
import com.slangs.sinjo.dto.WordDto;
import com.slangs.sinjo.entity.QuizWord;
import com.slangs.sinjo.entity.Role;
import com.slangs.sinjo.entity.User;
import com.slangs.sinjo.entity.Word;
import com.slangs.sinjo.exception.DuplicateWordException;
import com.slangs.sinjo.exception.NotFoundException;
import com.slangs.sinjo.repository.AttendanceRepository;
import com.slangs.sinjo.repository.LoginHistoryRepository;
import com.slangs.sinjo.repository.PointShopItemRepository;
import com.slangs.sinjo.repository.PointTransactionRepository;
import com.slangs.sinjo.repository.QuizAttemptRepository;
import com.slangs.sinjo.repository.QuizRepository;
import com.slangs.sinjo.repository.UserRepository;
import com.slangs.sinjo.repository.WordRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * REQ-ADMIN-01(사전 등록/수정/삭제), REQ-ADMIN-02(회원 관리),
 * REQ-ADMIN-03(퀴즈 전용 용어 관리), REQ-ADMIN-05(가입/로그인 추이 통계).
 */
@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock private WordRepository wordRepository;
    @Mock private UserRepository userRepository;
    @Mock private QuizRepository quizRepository;
    @Mock private QuizAttemptRepository quizAttemptRepository;
    @Mock private AttendanceRepository attendanceRepository;
    @Mock private PointTransactionRepository pointTransactionRepository;
    @Mock private PointShopItemRepository pointShopItemRepository;
    @Mock private LoginHistoryRepository loginHistoryRepository;

    @InjectMocks
    private AdminService adminService;

    private AdminDto.WordRequest wordRequest() {
        return new AdminDto.WordRequest("갓생", "부지런한 삶", "갓생 산다", "일상", "2020");
    }

    @Nested
    @DisplayName("REQ-ADMIN-01: 사전(신조어) 등록")
    class CreateWord {

        @Test
        void 중복_단어면_예외() {
            when(wordRepository.existsByWord("갓생")).thenReturn(true);

            assertThatThrownBy(() -> adminService.createWord(wordRequest()))
                    .isInstanceOf(DuplicateWordException.class);
        }

        @Test
        void 정상_등록시_저장된다() {
            when(wordRepository.existsByWord("갓생")).thenReturn(false);
            when(wordRepository.save(any(Word.class))).thenAnswer(inv -> inv.getArgument(0));

            WordDto result = adminService.createWord(wordRequest());

            assertThat(result.getWord()).isEqualTo("갓생");
            assertThat(result.getCategory()).isEqualTo("일상");
        }
    }

    @Nested
    @DisplayName("REQ-ADMIN-01: 사전(신조어) 수정/삭제")
    class UpdateDeleteWord {

        @Test
        void 존재하지_않으면_수정시_예외() {
            when(wordRepository.findById(1L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> adminService.updateWord(1L, wordRequest()))
                    .isInstanceOf(NotFoundException.class);
        }

        @Test
        void 다른_단어와_이름이_겹치면_수정시_예외() {
            Word target = new Word("옛날말", "뜻", "예문", "일상", null);
            when(wordRepository.findById(1L)).thenReturn(Optional.of(target));
            when(wordRepository.existsByWordAndIdNot("갓생", 1L)).thenReturn(true);

            assertThatThrownBy(() -> adminService.updateWord(1L, wordRequest()))
                    .isInstanceOf(DuplicateWordException.class);
        }

        @Test
        void 정상_수정된다() {
            Word target = new Word("옛날말", "옛뜻", "옛예문", "일상", null);
            when(wordRepository.findById(1L)).thenReturn(Optional.of(target));
            when(wordRepository.existsByWordAndIdNot("갓생", 1L)).thenReturn(false);

            WordDto result = adminService.updateWord(1L, wordRequest());

            assertThat(result.getWord()).isEqualTo("갓생");
            assertThat(result.getMeaning()).isEqualTo("부지런한 삶");
        }

        @Test
        void 존재하지_않으면_삭제시_예외() {
            when(wordRepository.existsById(1L)).thenReturn(false);

            assertThatThrownBy(() -> adminService.deleteWord(1L))
                    .isInstanceOf(NotFoundException.class);
        }

        @Test
        void 존재하면_삭제된다() {
            when(wordRepository.existsById(1L)).thenReturn(true);

            adminService.deleteWord(1L);

            verify(wordRepository).deleteById(1L);
        }
    }

    @Nested
    @DisplayName("REQ-ADMIN-02: 회원 권한 변경")
    class UpdateUserRole {

        @Test
        void 자기_자신의_권한은_바꿀_수_없다() {
            assertThatThrownBy(() -> adminService.updateUserRole(1L, 1L, new AdminDto.UpdateRoleRequest(Role.ADMIN)))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("자기 자신의 권한은 변경할 수 없습니다.");
        }

        @Test
        void 존재하지_않는_회원이면_예외() {
            when(userRepository.findById(2L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> adminService.updateUserRole(1L, 2L, new AdminDto.UpdateRoleRequest(Role.ADMIN)))
                    .isInstanceOf(NotFoundException.class);
        }

        @Test
        void 정상_요청이면_권한이_바뀐다() {
            User target = new User();
            target.setId(2L);
            when(userRepository.findById(2L)).thenReturn(Optional.of(target));

            UserDto.AdminUserRow result = adminService.updateUserRole(1L, 2L, new AdminDto.UpdateRoleRequest(Role.ADMIN));

            assertThat(result.role()).isEqualTo(Role.ADMIN);
            assertThat(target.getRole()).isEqualTo(Role.ADMIN);
        }
    }

    @Nested
    @DisplayName("REQ-ADMIN-02: 회원 정지/삭제")
    class DeleteUser {

        @Test
        void 자기_자신은_삭제할_수_없다() {
            assertThatThrownBy(() -> adminService.deleteUser(1L, 1L))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("자기 자신은 삭제할 수 없습니다.");
        }

        @Test
        void 존재하지_않는_회원이면_예외() {
            when(userRepository.existsById(2L)).thenReturn(false);

            assertThatThrownBy(() -> adminService.deleteUser(1L, 2L))
                    .isInstanceOf(NotFoundException.class);
        }

        @Test
        void 삭제_전에_연관_데이터를_먼저_지운다() {
            when(userRepository.existsById(2L)).thenReturn(true);

            adminService.deleteUser(1L, 2L);

            verify(quizAttemptRepository).deleteByUserId(2L);
            verify(attendanceRepository).deleteByUserId(2L);
            verify(pointTransactionRepository).deleteByUserId(2L);
            verify(userRepository).deleteById(2L);
        }
    }

    @Nested
    @DisplayName("REQ-ADMIN-03: 퀴즈 전용 용어 등록/수정")
    class QuizWordManagement {

        private AdminDto.QuizWordRequest request(List<String> options) {
            return new AdminDto.QuizWordRequest("혼밥", "혼자 밥을 먹는 것", "힌트", options, null);
        }

        @Test
        void 오답_보기가_2개_미만이면_등록시_예외() {
            assertThatThrownBy(() -> adminService.createQuizWord(request(List.of("보기1"))))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        void 빈_문자열_보기는_걸러내고_개수를_센다() {
            // "보기1", "  " (공백만) 은 실질적으로 1개뿐이라 등록이 막혀야 한다.
            assertThatThrownBy(() -> adminService.createQuizWord(request(List.of("보기1", "   "))))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        void 오답_보기가_충분하면_등록된다() {
            when(quizRepository.save(any(QuizWord.class))).thenAnswer(inv -> inv.getArgument(0));

            QuizWordDto result = adminService.createQuizWord(request(List.of("보기1", "보기2")));

            assertThat(result.getWord()).isEqualTo("혼밥");
            assertThat(result.getOptions()).containsExactly("보기1", "보기2");
        }

        @Test
        void 존재하지_않으면_수정시_예외() {
            when(quizRepository.findById(1L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> adminService.updateQuizWord(1L, request(List.of("보기1", "보기2"))))
                    .isInstanceOf(NotFoundException.class);
        }

        @Test
        void 존재하지_않으면_삭제시_예외() {
            when(quizRepository.existsById(1L)).thenReturn(false);

            assertThatThrownBy(() -> adminService.deleteQuizWord(1L))
                    .isInstanceOf(NotFoundException.class);
        }
    }

    @Nested
    @DisplayName("REQ-ADMIN-05: 가입/로그인 추이 통계")
    class Trend {

        @Test
        void 가입이_없는_날짜는_0으로_채워진다() {
            LocalDateTime today = LocalDateTime.now();
            when(userRepository.countDailySignups(any())).thenReturn(
                    List.<Object[]>of(new Object[]{today.toLocalDate().toString(), 3L})
            );

            List<AdminDto.DailyCount> result = adminService.getSignupTrend(3);

            assertThat(result).hasSize(3);
            assertThat(result.get(2).count()).isEqualTo(3L);
            assertThat(result.get(0).count()).isZero();
            assertThat(result.get(1).count()).isZero();
        }

        @Test
        void 로그인_추이도_같은_방식으로_채워진다() {
            when(loginHistoryRepository.countDailyLogins(any())).thenReturn(List.of());

            List<AdminDto.DailyCount> result = adminService.getLoginTrend(7);

            assertThat(result).hasSize(7);
            assertThat(result).allMatch(dailyCount -> dailyCount.count() == 0);
        }
    }
}
