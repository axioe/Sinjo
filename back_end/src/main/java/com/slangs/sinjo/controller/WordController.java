package com.slangs.sinjo.controller;

import com.slangs.sinjo.dto.WordAnswer;
import com.slangs.sinjo.dto.WordDto;
import com.slangs.sinjo.dto.WordSearchResponse;
import com.slangs.sinjo.dto.WordRequest;
import com.slangs.sinjo.entity.Word;
import com.slangs.sinjo.service.WordIndexService;
import com.slangs.sinjo.service.WordRagService;
import com.slangs.sinjo.service.WordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
     * <p>
     * [주의] 이 메서드는 반드시 getWord(@PathVariable id) 보다 위에 두는 것이 안전하다.
     * 스프링은 고정 경로("/ranking")를 변수 경로("/{id}")보다 우선하므로 지금도 동작하지만,
     * 읽는 사람이 헷갈리지 않도록 순서를 맞춰 둔다.
     */
    @GetMapping("/ranking")
    public List<WordDto> getRankingWords() {
        return wordService.getRankingWords();
    }

    @GetMapping
    public List<WordDto> getWords() {
        return wordService.getAllWords();
    }

    @GetMapping("/{id}")
    public WordDto getWord(
            @PathVariable Long id
    ) {
        return wordService.getWord(id);
    }

    @PostMapping("/{id}/like")
    public WordDto likeWord(
            @PathVariable Long id
    ) {
        return wordService.likeWord(id);
    }

    @PostMapping
    public WordDto create(
            @RequestBody WordRequest request
    ) {
        return wordService.create(request);
    }

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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id
    ) {
        wordService.delete(id);

        return ResponseEntity.noContent()
                .build();
    }

    @GetMapping("/ask")
    public WordAnswer ask(@RequestParam String question) {
        return wordRagService.ask(question);
    }

    @PostMapping("/index")
    public void index() {
        wordIndexService.indexAll();
    }

    @GetMapping("/search")
    public WordSearchResponse search(@RequestParam String question) {
        return wordRagService.search(question);
    }
}