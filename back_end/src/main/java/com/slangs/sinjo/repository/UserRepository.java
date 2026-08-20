package com.slangs.sinjo.repository;

import com.slangs.sinjo.entity.Provider;
import com.slangs.sinjo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    // 이메일
    Optional<User> findByEmail(String email);

    // 이메일 중복 확인
    boolean existsByEmail(String email);

    // 소셜 로그인
    Optional<User> findByProviderAndProviderId(Provider provider, String providerId);
}