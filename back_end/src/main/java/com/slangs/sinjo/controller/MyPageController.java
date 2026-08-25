package com.slangs.sinjo.controller;

import com.slangs.sinjo.dto.TranslationDto;
import com.slangs.sinjo.service.MyPageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/mypage")
@RequiredArgsConstructor
public class MyPageController {

    private final MyPageService myPageService;

    @GetMapping("/history")
    public ResponseEntity<List<TranslationDto>> getHistory(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size) {

        Long userId = 1L;
        return ResponseEntity.ok(myPageService.getHistory(userId, page, size));
    }

    @GetMapping("/history/count")
    public ResponseEntity<Long> getHistoryCount() {
        Long userId = 1L;
        return ResponseEntity.ok(myPageService.getTranslationCount(userId));
    }
}