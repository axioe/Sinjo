package com.slangs.sinjo.controller;

import com.slangs.sinjo.dto.FavoritesDto;
import com.slangs.sinjo.dto.QuizAttemptDto;
import com.slangs.sinjo.dto.TranslationDto;
import com.slangs.sinjo.dto.TranslationSaveRequest;
import com.slangs.sinjo.service.MyPageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mypage")
@RequiredArgsConstructor
public class MyPageController {

    private final MyPageService myPageService;

    /* ===================== 변환 이력 (REQ-AUTH-02) ===================== */

    @GetMapping("/history")
    public ResponseEntity<List<TranslationDto>> getHistory(
            @AuthenticationPrincipal Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {

        return ResponseEntity.ok(myPageService.getHistory(userId, page, size));
    }

    @GetMapping("/history/count")
    public ResponseEntity<Long> getHistoryCount(
            @AuthenticationPrincipal Long userId) {

        return ResponseEntity.ok(myPageService.getTranslationCount(userId));
    }

    @PostMapping("/history")
    public ResponseEntity<Void> saveHistory(
            @AuthenticationPrincipal Long userId,
            @RequestBody TranslationSaveRequest request) {

        myPageService.saveHistory(userId, request);
        return ResponseEntity.ok().build();
    }

    /* ===================== 즐겨찾기 (REQ-MY-01) ===================== */

    @GetMapping("/favorites")
    public ResponseEntity<List<FavoritesDto>> getFavorites(
            @AuthenticationPrincipal Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {

        return ResponseEntity.ok(myPageService.getFavorites(userId, page, size));
    }

    @GetMapping("/favorites/count")
    public ResponseEntity<Long> getFavoriteCount(
            @AuthenticationPrincipal Long userId) {

        return ResponseEntity.ok(myPageService.getFavoriteCount(userId));
    }

    @PostMapping("/favorites/{wordId}")
    public ResponseEntity<Void> addFavorite(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long wordId) {

        myPageService.addFavorite(userId, wordId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/favorites/{wordId}")
    public ResponseEntity<Void> removeFavorite(
            @AuthenticationPrincipal Long userId,
            @PathVariable Long wordId) {

        myPageService.removeFavorite(userId, wordId);
        return ResponseEntity.noContent().build();
    }

    /* ===================== 게임 기록 (REQ-MY-01) ===================== */

    @GetMapping("/games")
    public ResponseEntity<List<QuizAttemptDto>> getGameHistory(
            @AuthenticationPrincipal Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {

        return ResponseEntity.ok(myPageService.getGameHistory(userId, page, size));
    }
}