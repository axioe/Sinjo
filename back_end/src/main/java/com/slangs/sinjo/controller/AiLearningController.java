package com.slangs.sinjo.controller;

import com.slangs.sinjo.dto.QuizResponse;
import com.slangs.sinjo.service.AiLearningService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai/learning")
@RequiredArgsConstructor
public class AiLearningController {

    private final AiLearningService aiLearningService;

    @GetMapping("/today")
    public QuizResponse getTodayQuiz() {

        return aiLearningService.createTodayQuiz();
    }
}
