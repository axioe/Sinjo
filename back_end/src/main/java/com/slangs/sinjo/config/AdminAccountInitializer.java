package com.slangs.sinjo.config;

import com.slangs.sinjo.entity.Role;
import com.slangs.sinjo.entity.User;
import com.slangs.sinjo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 관리자 계정 시드 (REQ-ADM-01)
 *
 * 관리자는 회원가입 화면으로 만들 수 없다.
 * 가입 폼에서 권한을 고르게 하면 누구나 관리자가 될 수 있기 때문이다.
 * 그래서 앱이 켜질 때 코드로 한 번만 만든다.
 *
 * 이미 있으면 아무것도 하지 않으므로 여러 번 켜도 안전하다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminAccountInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email}")
    private String adminEmail;

    @Value("${app.admin.password}")
    private String adminPassword;

    @Value("${app.admin.nickname}")
    private String adminNickname;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        String email = adminEmail.trim().toLowerCase();

        userRepository.findByEmail(email).ifPresentOrElse(
                existing -> {
                    // 이미 일반 회원으로 가입돼 있으면 관리자로 올려준다.
                    // 이 처리가 없으면 그 이메일은 영영 관리자가 될 수 없다.
                    if (existing.getRole() != Role.ADMIN) {
                        existing.setRole(Role.ADMIN);
                        log.info("기존 계정을 관리자로 변경했습니다: {}", email);
                    }
                },
                () -> {
                    User admin = new User();
                    admin.setEmail(email);
                    admin.setPassword(passwordEncoder.encode(adminPassword));
                    admin.setNickname(adminNickname);
                    admin.setRole(Role.ADMIN);
                    userRepository.save(admin);

                    log.info("관리자 계정을 생성했습니다: {}", email);
                }
        );
    }
}
