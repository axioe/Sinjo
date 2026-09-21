package com.slangs.sinjo.controller;

import com.slangs.sinjo.dto.WordAnswer;
import com.slangs.sinjo.dto.WordDto;
import com.slangs.sinjo.dto.WordRequest;
import com.slangs.sinjo.dto.WordSearchResponse;
import com.slangs.sinjo.service.TranslationLimitService;
import com.slangs.sinjo.service.WordIndexService;
import com.slangs.sinjo.service.WordRagService;
import com.slangs.sinjo.service.WordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/words")
@RequiredArgsConstructor
public class WordController {

    private final WordService wordService;
    private final WordRagService wordRagService;
    private final WordIndexService wordIndexService;
    private final TranslationLimitService translationLimitService;

    /**
     * 인기 신조어 TOP 5
     */
    @GetMapping("/ranking")
    public List<WordDto> getRankingWords() {
        return wordService.getRankingWords();
    }

    /**
     * 현재 로그인 사용자가 좋아요한 단어 ID
     */
    @GetMapping("/liked")
    public List<Long> getLikedWordIds(
            @AuthenticationPrincipal Long userId
    ) {
        return wordService.getLikedWordIds(userId);
    }

    /**
     * 전체 신조어
     */
    @GetMapping
    public List<WordDto> getWords() {
        return wordService.getAllWords();
    }

    /**
     * 신조어 상세
     */
    @GetMapping("/{id}")
    public WordDto getWord(
            @PathVariable Long id
    ) {
        return wordService.getWord(id);
    }

    /**
     * 좋아요 추가
     */
    @PostMapping("/{id}/like")
    public WordDto likeWord(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId
    ) {
        return wordService.likeWord(
                id,
                userId
        );
    }

    /**
     * 좋아요 취소
     */
    @DeleteMapping("/{id}/like")
    public WordDto unlikeWord(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId
    ) {
        return wordService.unlikeWord(
                id,
                userId
        );
    }

    /**
     * 신조어 생성
     */
    @PostMapping
    public WordDto create(
            @RequestBody WordRequest request
    ) {
        return wordService.create(request);
    }

    /**
     * 신조어 수정
     */
    @PutMapping("/{id}")
    public WordDto update(
            @PathVariable Long id,
            @RequestBody WordRequest request
    ) {
        return wordService.update(
                id,
                request
        );
    }

    /**
     * 신조어 삭제
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id
    ) {
        wordService.delete(id);

        return ResponseEntity.noContent()
                .build();
    }

    /**
     * RAG 질문
     */
    @GetMapping("/ask")
    public WordAnswer ask(
            @RequestParam String question,
            @RequestParam(required = false)
            String category
    ) {
        return wordRagService.ask(
                question,
                category
        );
    }

    /**
     * VectorStore 전체 색인
     */
    @PostMapping("/index")
    public void index() {
        wordIndexService.indexAll();
    }

    /**
     * RAG 검색 (번역)
     * <p>
     * 로그인 사용자만 쓸 수 있고, 하루 {@link TranslationLimitService#DAILY_LIMIT}건으로
     * 제한된다 - 한도 확인/증가는 실제 검색 전에 먼저 처리해, 한도를 넘긴 요청이
     * RAG 호출까지 가지 않게 한다.
     */
    @GetMapping("/search")
    public WordSearchResponse search(
            @AuthenticationPrincipal Long userId,
            @RequestParam(defaultValue = "")
            String category,
            @RequestParam String question
    ) {
        translationLimitService.checkAndIncrement(userId);

        return wordRagService.search(
                category,
                question
        );
    }

    /**
     * 카테고리 목록
     */
    @GetMapping("/categories")
    public List<String> findCategories() {
        return wordService.findCategories();
    }
}
