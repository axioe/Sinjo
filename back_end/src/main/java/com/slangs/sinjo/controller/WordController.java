package com.slangs.sinjo.controller;

import com.slangs.sinjo.dto.WordAnswer;
import com.slangs.sinjo.dto.WordDto;
import com.slangs.sinjo.dto.WordSearchResponse;
import com.slangs.sinjo.dto.WordRequest;
import com.slangs.sinjo.service.WordIndexService;
import com.slangs.sinjo.service.WordRagService;
import com.slangs.sinjo.service.WordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/words")
@RequiredArgsConstructor
public class WordController {

    private final WordService wordService;

    private final WordRagService wordRagService;
    private final WordIndexService wordIndexService;

    /**
     * 인기 신조어 TOP 5
     * <p>
     * GET /api/words/ranking
     */
    @GetMapping("/ranking")
    public List<WordDto> getRankingWords() {
        return wordService.getRankingWords();
    }

    /**
     * 신조어 전체 목록
     */
    @GetMapping
    public List<WordDto> getWords() {
        return wordService.getAllWords();
    }

    /**
     * 신조어 한 건
     * <p>
     * 상세 페이지 진입 시 조회수 +1
     */
    @GetMapping("/{id}")
    public WordDto getWord(
            @PathVariable Long id
    ) {
        return wordService.getWord(id);
    }

    /**
     * 좋아요
     * <p>
     * 같은 사용자가 같은 단어에 여러 번 요청해도
     * 좋아요는 최초 1회만 증가한다.
     * <p>
     * JwtAuthenticationFilter가 Authentication의 principal에
     * Long userId를 넣고 있으므로 @AuthenticationPrincipal Long으로 받는다.
     */
    @PostMapping("/{id}/like")
    public WordDto likeWord(
            @PathVariable Long id,
            @AuthenticationPrincipal Long userId
    ) {

        if (userId == null) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "로그인이 필요한 기능입니다."
            );
        }

        return wordService.likeWord(
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
     * AI 질문
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
     * 전체 신조어 VectorStore 인덱싱
     */
    @PostMapping("/index")
    public void index() {
        wordIndexService.indexAll();
    }

    /**
     * AI 검색
     */
    @GetMapping("/search")
    public WordSearchResponse search(
            @RequestParam(defaultValue = "")
            String category,

            @RequestParam
            String question
    ) {
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
