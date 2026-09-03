package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.UserDto;
import com.slangs.sinjo.entity.LoginHistory;
import com.slangs.sinjo.entity.PasswordResetToken;
import com.slangs.sinjo.entity.Provider;
import com.slangs.sinjo.entity.User;
import com.slangs.sinjo.exception.DuplicateEmailException;
import com.slangs.sinjo.exception.InvalidCredentialsException;
import com.slangs.sinjo.repository.LoginHistoryRepository;
import com.slangs.sinjo.repository.PasswordResetTokenRepository;
import com.slangs.sinjo.repository.UserRepository;
import com.slangs.sinjo.security.JwtProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;
    private final PasswordResetTokenRepository tokenRepository;
    private final JavaMailSender mailSender;
    private final AttendanceService attendanceService;
    private final LoginHistoryRepository loginHistoryRepository;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Transactional
    public UserDto.Response signup(UserDto.SignupRequest request) {
        String email = normalizeEmail(request.email());

        if (userRepository.existsByEmail(email)) {
            throw new DuplicateEmailException();
        }

        User user = new User();
        user.setEmail(email);
        // 평문 저장 금지. 해시해서 넣는다.
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setNickname(request.nickname().trim());

        return UserDto.Response.from(userRepository.save(user));
    }

    @Transactional
    public UserDto.LoginResponse login(UserDto.LoginRequest request) {
        User user = userRepository.findByEmail(normalizeEmail(request.email()))
                .orElseThrow(InvalidCredentialsException::new);

        // 해시는 원문으로 되돌릴 수 없다. matches 로 대조한다.
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new InvalidCredentialsException();
        }

        user.updateLastLoginAt();
        attendanceService.checkIn(user.getId());

//        로그인 기록
        loginHistoryRepository.save(new LoginHistory(user.getId()));

        String token = jwtProvider.createToken(user.getId(), user.getEmail(), user.getRole());
        return new UserDto.LoginResponse(token, UserDto.Response.from(user));
    }

    /** 마이페이지용. 토큰에서 꺼낸 id 로 본인 정보를 조회한다. */
    @Transactional(readOnly = true)
    public UserDto.Response getMyInfo(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(InvalidCredentialsException::new);

        return UserDto.Response.from(user);
    }

    /**
     * 이메일은 대소문자를 구분하지 않는 것이 사용자 기대에 맞다.
     * 저장·조회 모두 소문자로 통일해 Kim@... 과 kim@... 이 다른 계정이 되는 것을 막는다.
     */
    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    //    비밀번호 찾기
    @Transactional
    public void requestPasswordReset(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            String token = UUID.randomUUID().toString();

            tokenRepository.save(new PasswordResetToken(
                    token, user.getId(), LocalDateTime.now().plusMinutes(30)
            ));

            String link = frontendUrl + "/reset-password?token=" + token;

            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setTo(email);
            mail.setSubject("[신세대 번역기] 비밀번호 재설정");
            mail.setText("아래 링크에서 새 비밀번호를 설정하세요. 30분간 유효합니다.\n\n" + link);
            mailSender.send(mail);
        });
        }

    @Transactional
    public void confirmPasswordReset(String token, String newPassword) {
        PasswordResetToken prt = tokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 링크입니다."));

        if (!prt.isValid()) {
            throw new IllegalArgumentException("만료되었거나 이미 사용된 링크입니다.");
        }

        User user = userRepository.findById(prt.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        user.setPassword(passwordEncoder.encode(newPassword));
        prt.setUsed(true);
    }

    @Transactional
    public UserDto.Response updateNickname(Long userId, UserDto.UpdateNicknameRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(InvalidCredentialsException::new);

        user.setNickname(request.nickname().trim());

        return UserDto.Response.from(user);
    }

    @Transactional
    public void changePassword(Long userId, UserDto.ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(InvalidCredentialsException::new);

        // 소셜 가입자는 우리 쪽 비밀번호가 랜덤값이라 확인 자체가 불가능하다.
        if (user.getProvider() != null && user.getProvider() != Provider.LOCAL) {
            throw new IllegalArgumentException("소셜 로그인 계정은 비밀번호를 변경할 수 없습니다.");
        }

        // 자리를 비운 사이 남이 몰래 바꾸는 것을 막는다.
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("현재 비밀번호가 올바르지 않습니다.");
        }

        if (request.currentPassword().equals(request.newPassword())) {
            throw new IllegalArgumentException("현재 비밀번호와 다른 값을 입력해 주세요.");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
    }
}