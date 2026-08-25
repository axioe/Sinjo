package com.slangs.sinjo.controller;

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

    @GetMapping("/history")
    public ResponseEntity<List<TranslationDto>> getHistory(
            @AuthenticationPrincipal Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {

        return ResponseEntity.ok(myPageService.getHistory(userId, page, size));
    }

    @GetMapping("/history/count")
    public ResponseEntity<Long> getHistoryCount(
            @AuthenticationPrincipal Long userId
    ) {

        return ResponseEntity.ok(myPageService.getTranslationCount(userId));
    }

    @PostMapping("/history")
    public ResponseEntity<Void> saveHistory(
            @AuthenticationPrincipal Long userId,
            @RequestBody TranslationSaveRequest request
    ) {

        myPageService.saveHistory(userId, request);
        return ResponseEntity.ok().build();
    }
}