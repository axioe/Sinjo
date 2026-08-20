package com.slangs.sinjo.controller;

import com.slangs.sinjo.dto.AdminDto;
import com.slangs.sinjo.dto.UserDto;
import com.slangs.sinjo.dto.WordDto;
import com.slangs.sinjo.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 관리자 전용 API (REQ-ADM-01)
 * <p>
 * 이 컨트롤러에는 권한 확인 코드가 한 줄도 없다.
 * SecurityConfig 에서 /api/admin/** 를 ADMIN 만 통과하도록 막아두었기 때문이다.
 * 한 곳에서 막으면 새 메서드를 추가할 때 확인을 빠뜨릴 일이 없다.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/summary")
    public ResponseEntity<AdminDto.Summary> summary() {
        return ResponseEntity.ok(adminService.getSummary());
    }

    // ---- 용어 관리 --------------------------------------------------------

    @GetMapping("/words")
    public ResponseEntity<List<WordDto>> getWords() {
        return ResponseEntity.ok(adminService.getWords());
    }

    @PostMapping("/words")
    public ResponseEntity<WordDto> createWord(@Valid @RequestBody AdminDto.WordRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createWord(request));
    }

    @PutMapping("/words/{id}")
    public ResponseEntity<WordDto> updateWord(@PathVariable Long id,
                                              @Valid @RequestBody AdminDto.WordRequest request) {
        return ResponseEntity.ok(adminService.updateWord(id, request));
    }

    @DeleteMapping("/words/{id}")
    public ResponseEntity<Void> deleteWord(@PathVariable Long id) {
        adminService.deleteWord(id);
        return ResponseEntity.noContent().build();
    }

    // ---- 회원 관리 --------------------------------------------------------

    @GetMapping("/users")
    public ResponseEntity<List<UserDto.AdminUserRow>> getUsers() {
        return ResponseEntity.ok(adminService.getUsers());
    }
}
