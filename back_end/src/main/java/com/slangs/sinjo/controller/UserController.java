package com.slangs.sinjo.controller;

import com.slangs.sinjo.dto.UserDto;
import com.slangs.sinjo.exception.UnauthorizedException;
import com.slangs.sinjo.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/signup")
    public ResponseEntity<UserDto.Response> signup(@Valid @RequestBody UserDto.SignupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.signup(request));
    }

    @PostMapping("/login")
    public ResponseEntity<UserDto.LoginResponse> login(@Valid @RequestBody UserDto.LoginRequest request) {
        return ResponseEntity.ok(userService.login(request));
    }

    /**
     * 내 정보 조회.
     *
     * [수정 1] "/me" 경로를 추가했다.
     *   프론트 api/userApi.js 의 getMyInfo() 가 GET /api/users/me 를 호출하는데
     *   서버에는 /mypage 밖에 없어서 404 가 났다.
     *   그 404 를 Auth.jsx 가 "토큰이 만료된 것" 으로 해석해 clearToken() 을 호출하므로
     *   → 로그인한 뒤 새로고침만 하면 매번 로그아웃되는 상태였다.
     *   프론트를 고치면 다른 팀원 작업과 충돌할 수 있어 서버가 두 주소를 모두 받도록 했다.
     *   (정리할 때 /mypage 를 지우고 /me 하나로 통일하는 것을 권장한다)
     *
     * [수정 2] userId 가 null 인 경우를 막는다.
     *   SecurityConfig 가 anyRequest().permitAll() 이라 토큰 없이도 이 메서드에 들어온다.
     *   이때 principal 은 익명 사용자("anonymousUser", String)라
     *   @AuthenticationPrincipal Long 에는 null 이 들어오고,
     *   findById(null) 에서 InvalidDataAccessApiUsageException → 500 이 났다.
     *   이제 401 로 정확히 응답한다.
     */
    @GetMapping({"/me", "/mypage"})
    public ResponseEntity<UserDto.Response> mypage(@AuthenticationPrincipal Long userId) {
        if (userId == null) {
            throw new UnauthorizedException();
        }
        return ResponseEntity.ok(userService.getMyInfo(userId));
    }
}
