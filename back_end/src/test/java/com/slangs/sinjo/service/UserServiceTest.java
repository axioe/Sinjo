package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.UserDto;
import com.slangs.sinjo.entity.LoginHistory;
import com.slangs.sinjo.entity.PasswordResetToken;
import com.slangs.sinjo.entity.Provider;
import com.slangs.sinjo.entity.Role;
import com.slangs.sinjo.entity.User;
import com.slangs.sinjo.exception.InvalidCredentialsException;
import com.slangs.sinjo.repository.LoginHistoryRepository;
import com.slangs.sinjo.repository.PasswordResetTokenRepository;
import com.slangs.sinjo.repository.UserRepository;
import com.slangs.sinjo.security.JwtProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * REQ-AUTH-02: 일반 로그인, REQ-MYPAGE-04: 계정 정보 수정(닉네임/비밀번호), REQ-AUTH-05: 비밀번호 찾기/재설정.
 */
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtProvider jwtProvider;

    @Mock
    private PasswordResetTokenRepository tokenRepository;

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private AttendanceService attendanceService;

    @Mock
    private LoginHistoryRepository loginHistoryRepository;

    @InjectMocks
    private UserService userService;

    private User user(Provider provider, String encodedPassword) {
        User user = new User();
        user.setId(1L);
        user.setEmail("test@example.com");
        user.setNickname("기존닉네임");
        user.setProvider(provider);
        user.setPassword(encodedPassword);
        return user;
    }

    @Nested
    @DisplayName("REQ-AUTH-02: 로그인")
    class Login {

        @Test
        void 존재하지_않는_이메일이면_예외() {
            when(userRepository.findByEmail("no-such@example.com")).thenReturn(Optional.empty());

            assertThatThrownBy(() ->
                    userService.login(new UserDto.LoginRequest("no-such@example.com", "아무거나1234")))
                    .isInstanceOf(InvalidCredentialsException.class);

            verify(attendanceService, never()).checkIn(any());
            verify(loginHistoryRepository, never()).save(any());
        }

        @Test
        void 비밀번호가_틀리면_예외() {
            User user = user(Provider.LOCAL, "encoded");
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("틀린비번", "encoded")).thenReturn(false);

            assertThatThrownBy(() ->
                    userService.login(new UserDto.LoginRequest("test@example.com", "틀린비번")))
                    .isInstanceOf(InvalidCredentialsException.class);

            verify(attendanceService, never()).checkIn(any());
            verify(loginHistoryRepository, never()).save(any());
        }

        @Test
        void 이메일_대소문자는_구분하지_않는다() {
            User user = user(Provider.LOCAL, "encoded");
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("올바른비번1234", "encoded")).thenReturn(true);

            userService.login(new UserDto.LoginRequest("  Test@Example.com  ", "올바른비번1234"));

            verify(userRepository).findByEmail("test@example.com");
        }

        @Test
        void 정상_로그인이면_토큰_발급과_함께_출석체크_로그인기록이_남는다() {
            User user = user(Provider.LOCAL, "encoded");
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("올바른비번1234", "encoded")).thenReturn(true);
            when(jwtProvider.createToken(1L, "test@example.com", Role.USER)).thenReturn("jwt-token");

            UserDto.LoginResponse response =
                    userService.login(new UserDto.LoginRequest("test@example.com", "올바른비번1234"));

            assertThat(response.token()).isEqualTo("jwt-token");
            assertThat(response.user().email()).isEqualTo("test@example.com");
            verify(attendanceService).checkIn(1L);
            ArgumentCaptor<LoginHistory> captor = ArgumentCaptor.forClass(LoginHistory.class);
            verify(loginHistoryRepository).save(captor.capture());
            assertThat(captor.getValue().getUserId()).isEqualTo(1L);
        }
    }

    @Nested
    @DisplayName("REQ-MYPAGE-04: 닉네임 변경")
    class UpdateNickname {

        @Test
        void 존재하지_않는_사용자면_예외() {
            when(userRepository.findById(1L)).thenReturn(Optional.empty());

            assertThatThrownBy(() ->
                    userService.updateNickname(1L, new UserDto.UpdateNicknameRequest("새닉네임")))
                    .isInstanceOf(InvalidCredentialsException.class);
        }

        @Test
        void 정상_요청이면_닉네임이_바뀐다() {
            User user = user(Provider.LOCAL, "encoded");
            when(userRepository.findById(1L)).thenReturn(Optional.of(user));

            UserDto.Response response = userService.updateNickname(1L, new UserDto.UpdateNicknameRequest("  새닉네임  "));

            assertThat(response.nickname()).isEqualTo("새닉네임");
            assertThat(user.getNickname()).isEqualTo("새닉네임");
        }
    }

    @Nested
    @DisplayName("REQ-MYPAGE-04: 비밀번호 변경")
    class ChangePassword {

        @Test
        void 소셜_로그인_계정이면_예외() {
            User user = user(Provider.NAVER, "encoded");
            when(userRepository.findById(1L)).thenReturn(Optional.of(user));

            assertThatThrownBy(() ->
                    userService.changePassword(1L, new UserDto.ChangePasswordRequest("현재비번", "새비번1234")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("소셜 로그인 계정은 비밀번호를 변경할 수 없습니다.");
        }

        @Test
        void 현재_비밀번호가_틀리면_예외() {
            User user = user(Provider.LOCAL, "encoded");
            when(userRepository.findById(1L)).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("틀린비번", "encoded")).thenReturn(false);

            assertThatThrownBy(() ->
                    userService.changePassword(1L, new UserDto.ChangePasswordRequest("틀린비번", "새비번1234")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("현재 비밀번호가 올바르지 않습니다.");
        }

        @Test
        void 새_비밀번호가_현재와_같으면_예외() {
            User user = user(Provider.LOCAL, "encoded");
            when(userRepository.findById(1L)).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("같은비번1234", "encoded")).thenReturn(true);

            assertThatThrownBy(() ->
                    userService.changePassword(1L, new UserDto.ChangePasswordRequest("같은비번1234", "같은비번1234")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("현재 비밀번호와 다른 값을 입력해 주세요.");
        }

        @Test
        void 정상_요청이면_비밀번호가_새로_인코딩되어_저장된다() {
            User user = user(Provider.LOCAL, "encoded-old");
            when(userRepository.findById(1L)).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("현재비번1234", "encoded-old")).thenReturn(true);
            when(passwordEncoder.encode("새비번1234")).thenReturn("encoded-new");

            userService.changePassword(1L, new UserDto.ChangePasswordRequest("현재비번1234", "새비번1234"));

            assertThat(user.getPassword()).isEqualTo("encoded-new");
            verify(passwordEncoder).encode("새비번1234");
        }
    }

    @Nested
    @DisplayName("REQ-AUTH-05: 비밀번호 재설정 메일 발송")
    class RequestPasswordReset {

        @Test
        void 존재하지_않는_이메일이면_아무_일도_하지_않는다() {
            when(userRepository.findByEmail("no-such@example.com")).thenReturn(Optional.empty());

            userService.requestPasswordReset("no-such@example.com");

            verify(tokenRepository, never()).save(any());
            verify(mailSender, never()).send(any(SimpleMailMessage.class));
        }

        @Test
        void 존재하는_이메일이면_토큰을_저장하고_메일을_보낸다() {
            User user = user(Provider.LOCAL, "encoded");
            when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

            userService.requestPasswordReset("test@example.com");

            ArgumentCaptor<PasswordResetToken> captor = ArgumentCaptor.forClass(PasswordResetToken.class);
            verify(tokenRepository).save(captor.capture());
            assertThat(captor.getValue().getUserId()).isEqualTo(1L);
            verify(mailSender).send(any(SimpleMailMessage.class));
        }
    }

    @Nested
    @DisplayName("REQ-AUTH-05: 비밀번호 재설정 확정")
    class ConfirmPasswordReset {

        @Test
        void 존재하지_않는_토큰이면_예외() {
            when(tokenRepository.findByToken("no-such-token")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.confirmPasswordReset("no-such-token", "새비번1234"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("유효하지 않은 링크입니다.");
        }

        @Test
        void 만료된_토큰이면_예외() {
            PasswordResetToken token = new PasswordResetToken("t1", 1L, LocalDateTime.now().minusMinutes(1));
            when(tokenRepository.findByToken("t1")).thenReturn(Optional.of(token));

            assertThatThrownBy(() -> userService.confirmPasswordReset("t1", "새비번1234"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("만료되었거나 이미 사용된 링크입니다.");
        }

        @Test
        void 이미_사용된_토큰이면_예외() {
            PasswordResetToken token = new PasswordResetToken("t1", 1L, LocalDateTime.now().plusMinutes(10));
            token.setUsed(true);
            when(tokenRepository.findByToken("t1")).thenReturn(Optional.of(token));

            assertThatThrownBy(() -> userService.confirmPasswordReset("t1", "새비번1234"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("만료되었거나 이미 사용된 링크입니다.");
        }

        @Test
        void 사용자를_찾을_수_없으면_예외() {
            PasswordResetToken token = new PasswordResetToken("t1", 1L, LocalDateTime.now().plusMinutes(10));
            when(tokenRepository.findByToken("t1")).thenReturn(Optional.of(token));
            when(userRepository.findById(1L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> userService.confirmPasswordReset("t1", "새비번1234"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("사용자를 찾을 수 없습니다.");
        }

        @Test
        void 정상_처리시_비밀번호가_바뀌고_토큰이_사용_처리된다() {
            PasswordResetToken token = new PasswordResetToken("t1", 1L, LocalDateTime.now().plusMinutes(10));
            User user = user(Provider.LOCAL, "encoded-old");
            when(tokenRepository.findByToken("t1")).thenReturn(Optional.of(token));
            when(userRepository.findById(1L)).thenReturn(Optional.of(user));
            when(passwordEncoder.encode("새비번1234")).thenReturn("encoded-new");

            userService.confirmPasswordReset("t1", "새비번1234");

            assertThat(user.getPassword()).isEqualTo("encoded-new");
            assertThat(token.isUsed()).isTrue();
        }
    }
}
