package com.slangs.sinjo.controller;

import com.slangs.sinjo.dto.QuizResponse;
import com.slangs.sinjo.service.AiLearningService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai/learning")
@RequiredArgsConstructor
public class AiLearningController {

    private final AiLearningService aiLearningService;

    /**
     * 오늘의 AI 신조어 학습 문제
     */
    @GetMapping("/today")
    public QuizResponse getTodayQuiz(
            @AuthenticationPrincipal Long userId
    ) {
        return aiLearningService.createTodayQuiz(userId);
    }


    /**
     * 학습 완료
     */
    @PostMapping("/complete")
    public void completeLearning(
            @AuthenticationPrincipal Long userId,
            @RequestBody List<Long> wordIds
    ) {

       if(userId == null)
           return;

        aiLearningService.completeLearning(
                userId,
                wordIds
        );
    }
}
