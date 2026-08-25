package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.QueryType;
import com.slangs.sinjo.dto.WordAnswer;
import com.slangs.sinjo.dto.WordQuery;
import com.slangs.sinjo.dto.WordSearchResponse;
import com.slangs.sinjo.entity.TranslationMode;
import com.slangs.sinjo.entity.Translations;
import com.slangs.sinjo.entity.Word;
import com.slangs.sinjo.repository.TranslationsRepository;
import com.slangs.sinjo.repository.WordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.stereotype.Service;
import org.springframework.util.ObjectUtils;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class WordRagService {

    private final WordRepository wordRepository;
    private final WordSearchService searchService;
    private final WordAnswerService answerService;
//    번역 기록 연동
    private final TranslationsRepository translationsRepository;

    /**
     * 신조어 질문
     *
     * PVector
     *   ↓
     * DB
     *   ↓
     * LLM
     */
    public WordAnswer ask(
            String question,
            String category
    ) {

        long start = System.currentTimeMillis();

        log.info(
                "[RAG] question={}, category={}",
                question,
                category
        );

        /*
         * 1. PVector 검색
         */
        List<Document> documents;

        if (category == null || category.isBlank()) {
            documents = searchService.search(
                    question,
                    3
            );
        } else {
            documents = searchService.searchByCategory(
                    question,
                    category,
                    3
            );
        }

        /*
         * 2. 검색 결과 없음
         */
        if (documents == null || documents.isEmpty()) {
            log.info(
                    "[RAG] Vector result = 0"
            );
            /*
             * PVector에 없으면
             * LLM에게 질문
             */
            WordAnswer answer =
                    answerService.answerWithoutContext(
                            question
                    );
            log.info(
                    "[RAG] Total = {} ms",
                    System.currentTimeMillis() - start
            );

            return answer;
        }

        /*
         * 3. 검색된 Document의 wordId로
         *    실제 DB 데이터 조회
         */
        Document first = documents.getFirst();
        Map<String, Object> metadata = first.getMetadata();

        String wordId =
                String.valueOf(
                        metadata.get("wordId")
                );

        Word word = null;
        if (wordId != null && !"null".equals(wordId)) {
            try {
                word =
                        wordRepository.findById(
                                Long.parseLong(wordId)
                        ).orElse(null);

            } catch (NumberFormatException e) {
                log.warn(
                        "[RAG] 잘못된 wordId={}",
                        wordId
                );
            }
        }

        /*
         * 4. DB 데이터가 존재하면
         *    DB + LLM
         */
        if (word != null) {
            WordAnswer answer =
                    answerService.answer(
                            question,
                            documents,
                            word
                    );
            log.info(
                    "[RAG] DB + LLM Total = {} ms",
                    System.currentTimeMillis() - start
            );

            return answer;
        }

        /*
         * 5. PVector는 찾았지만
         *    DB 데이터를 못 찾은 경우
         */
        log.warn(
                "[RAG] Vector found but DB not found. wordId={}",
                wordId
        );

        WordAnswer answer =
                answerService.answerWithoutContext(
                        question
                );

        log.info(
                "[RAG] Total = {} ms",
                System.currentTimeMillis() - start
        );

        return answer;
    }

    /**
     * 검색 API
     */
    public WordSearchResponse search(
            String category,
            String question,
//            유저아이디 연동
            Long userId
    ) {

        long start =
                System.currentTimeMillis();

        List<Document> documents;

        if (category == null
                || category.isBlank()) {

            documents =
                    searchService.search(
                            question,
                            3
                    );

        } else {

            documents =
                    searchService.searchByCategory(
                            question,
                            category,
                            3
                    );
        }

        log.info(
                "[RAG] question={}, elapsed={}ms, resultCount={}",
                question,
                System.currentTimeMillis() - start,
                documents.size()
        );

        if (documents.isEmpty()) {

            return new WordSearchResponse(
                    false,
                    List.of()
            );
        }

        List<WordAnswer> results =
                documents.stream()
                        .map(this::toResponse)
                        .toList();

        saveHistory(userId, question, results); // 호출 추가

        return new WordSearchResponse(
                true,
                results
        );
    }

    /**
     * 번역 이력 저장 (REQ-AUTH-02)
     * 비로그인(userId == null)이면 저장하지 않는다.
     */
    private void saveHistory(
            Long userId,
            String question,
            List<WordAnswer> results
    ) {

        if (userId == null || results.isEmpty()) {
            return;
        }

        WordAnswer top = results.getFirst();

        try {
            translationsRepository.save(
                    Translations.builder()
                            .userId(userId)
                            .mode(TranslationMode.EXPLAIN)
                            .originalText(question)
                            .translatedText(top.meaning())
                            .explanation(top.answer())
                            .build()
            );
        } catch (Exception e) {
            log.warn("[RAG] 번역 이력 저장 실패 userId={}", userId, e);
        }
    }

    private WordAnswer toResponse(
            Document document
    ) {

        Map<String, Object> metadata =
                document.getMetadata();

        String word =
                String.valueOf(
                        metadata.get("word")
                );

        String category =
                String.valueOf(
                        metadata.get("category")
                );

        String wordId =
                String.valueOf(
                        metadata.get("wordId")
                );

        Word wordObj = null;

        try {

            wordObj =
                    wordRepository.findById(
                            Long.parseLong(wordId)
                    ).orElse(null);

        } catch (Exception e) {

            log.warn(
                    "[RAG] DB 조회 실패 wordId={}",
                    wordId
            );
        }

        String meaning = "";
        String example = "";

        if (wordObj != null) {

            meaning =
                    wordObj.getMeaning();

            example =
                    wordObj.getExample();
        }

        return new WordAnswer(
                true,
                word,
                meaning,
                category,
                example
        );
    }
}