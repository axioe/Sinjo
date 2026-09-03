package com.slangs.sinjo.repository;

import com.slangs.sinjo.entity.Provider;
import com.slangs.sinjo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    // 이메일
    Optional<User> findByEmail(String email);

    // 이메일 중복 확인
    boolean existsByEmail(String email);

    // 소셜 로그인
    Optional<User> findByProviderAndProviderId(Provider provider, String providerId);

//    통계 대시보드
    @Query("""
    select function('date', u.createdAt), count(u)
    from User u
    where u.createdAt >= :from
    group by function('date', u.createdAt)
    order by function('date', u.createdAt)
""")
    List<Object[]> countDailySignups(@Param("from") LocalDateTime from);
}