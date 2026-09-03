package com.slangs.sinjo.controller;

import com.slangs.sinjo.dto.AdminDto;
import com.slangs.sinjo.dto.PointDto;
import com.slangs.sinjo.dto.QuizWordDto;
import com.slangs.sinjo.dto.UserDto;
import com.slangs.sinjo.dto.WordDto;
import com.slangs.sinjo.service.AdminService;
import com.slangs.sinjo.service.WordExcelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
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
    private final WordExcelService wordExcelService;

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

//    엑셀 업로드 기능 추가
    @PostMapping("/words/excel")
    public ResponseEntity<?> uploadExcel(@RequestParam("file") MultipartFile file) {
        String name = file.getOriginalFilename();
        if (name == null || !(name.endsWith(".xlsx") || name.endsWith(".xls"))) {
            return ResponseEntity.badRequest().body("엑셀 파일만 업로드할 수 있습니다.");
        }

        try {
            return ResponseEntity.ok(wordExcelService.upload(file));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("파일을 읽지 못했습니다.");
        }
    }

    // ---- 회원 관리 --------------------------------------------------------

    @GetMapping("/users")
    public ResponseEntity<List<UserDto.AdminUserRow>> getUsers() {
        return ResponseEntity.ok(adminService.getUsers());
    }

    @PatchMapping("/users/{id}/role")
    public ResponseEntity<UserDto.AdminUserRow> updateUserRole(
            @AuthenticationPrincipal Long adminId,
            @PathVariable Long id,
            @Valid @RequestBody AdminDto.UpdateRoleRequest request) {
        return ResponseEntity.ok(adminService.updateUserRole(adminId, id, request));
    }

    @PatchMapping("/users/{id}")
    public ResponseEntity<UserDto.AdminUserRow> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody AdminDto.UpdateUserRequest request) {
        return ResponseEntity.ok(adminService.updateUser(id, request));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(
            @AuthenticationPrincipal Long adminId,
            @PathVariable Long id) {
        adminService.deleteUser(adminId, id);
        return ResponseEntity.noContent().build();
    }

    // ---- 퀴즈 관리 --------------------------------------------------------

    @GetMapping("/quizzes")
    public ResponseEntity<List<QuizWordDto>> getQuizWords() {
        return ResponseEntity.ok(adminService.getQuizWords());
    }

    @PostMapping("/quizzes")
    public ResponseEntity<QuizWordDto> createQuizWord(@Valid @RequestBody AdminDto.QuizWordRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createQuizWord(request));
    }

    @PutMapping("/quizzes/{id}")
    public ResponseEntity<QuizWordDto> updateQuizWord(@PathVariable Long id,
                                                       @Valid @RequestBody AdminDto.QuizWordRequest request) {
        return ResponseEntity.ok(adminService.updateQuizWord(id, request));
    }

    @DeleteMapping("/quizzes/{id}")
    public ResponseEntity<Void> deleteQuizWord(@PathVariable Long id) {
        adminService.deleteQuizWord(id);
        return ResponseEntity.noContent().build();
    }

    // ---- 포인트 상점 관리 --------------------------------------------------

    @GetMapping("/point-shop-items")
    public ResponseEntity<List<PointDto.ShopItem>> getPointShopItems() {
        return ResponseEntity.ok(adminService.getPointShopItems());
    }

    @PostMapping("/point-shop-items")
    public ResponseEntity<PointDto.ShopItem> createPointShopItem(
            @Valid @RequestBody AdminDto.PointShopItemRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminService.createPointShopItem(request));
    }

    @PutMapping("/point-shop-items/{id}")
    public ResponseEntity<PointDto.ShopItem> updatePointShopItem(
            @PathVariable Long id,
            @Valid @RequestBody AdminDto.PointShopItemRequest request) {
        return ResponseEntity.ok(adminService.updatePointShopItem(id, request));
    }

    @DeleteMapping("/point-shop-items/{id}")
    public ResponseEntity<Void> deletePointShopItem(@PathVariable Long id) {
        adminService.deletePointShopItem(id);
        return ResponseEntity.noContent().build();
    }

//    통계 대시보드
    @GetMapping("/stats/signups")
    public ResponseEntity<List<AdminDto.DailyCount>> signupTrend(
            @RequestParam(defaultValue = "14") int days) {
        return ResponseEntity.ok(adminService.getSignupTrend(days));
    }

    @GetMapping("/stats/logins")
    public ResponseEntity<List<AdminDto.DailyCount>> loginTrend(
            @RequestParam(defaultValue = "14") int days) {
        return ResponseEntity.ok(adminService.getLoginTrend(days));
    }
}
