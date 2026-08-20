package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.QueryType;
import com.slangs.sinjo.dto.WordAnswer;
import com.slangs.sinjo.dto.WordQuery;
import com.slangs.sinjo.dto.WordSearchResponse;
import com.slangs.sinjo.entity.Word;
import com.slangs.sinjo.repository.WordRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class WordRagService {
    private final WordRepository wordRepository;
    private final WordQueryAnalyzer queryAnalyzer;
    private final WordSearchService searchService;
    private final WordAnswerService answerService;

    public WordRagService(
            WordRepository wordRepository,
            WordQueryAnalyzer queryAnalyzer,
            WordSearchService searchService,
            WordAnswerService answerService
    ) {
        this.wordRepository = wordRepository;
        this.queryAnalyzer = queryAnalyzer;
        this.searchService = searchService;
        this.answerService = answerService;
    }

    public WordAnswer ask(String question) {
        long start = System.currentTimeMillis();

        log.info("[RAG] Question = {}", question);

        // 1. Query 분석
//        List<String> categories =
//                wordRepository.findCategories();
//
//        WordQuery query =
//                queryAnalyzer.analyze(
//                        question,
//                        categories
//                );

        // 2. 검색
        List<Document> documents;

//        if (query.queryType() == QueryType.CATEGORY && query.category() != null) {
//            documents = searchService.searchByCategory(
//                    query.searchQuery(),
//                    query.category(),
//                    3
//            );
//        } else {

//            documents = searchService.search(
//                    query.searchQuery(),
//                    3
//            );
//        }

        documents = searchService.search(question, 3);

        // 3. 검색 결과 없음
        if (documents.isEmpty()) {
            long elapsed =
                    System.currentTimeMillis() - start;

            log.info(
                    "[RAG] Total = {} ms (NOT FOUND)",
                    elapsed
            );

            return notFound();
        }

        // 4. LLM 최종 답변
        WordAnswer answer =  answerService.answer(
                question,
                documents
        );
        long elapsed =
                System.currentTimeMillis() - start;

        log.info(
                "[RAG] Total = {} ms",
                elapsed
        );

        return answer;
    }

    private WordAnswer notFound() {

        return new WordAnswer(
                false,
                null,
                null,
                null,
                "사전에 없는 내용입니다."
        );
    }

    public WordSearchResponse search(String question) {

        long start = System.currentTimeMillis();
        List<Document> documents = searchService.search(question, 3);

        long elapsed = System.currentTimeMillis() - start;

        log.info(
                "[RAG] question={}, elapsed={}ms, resultCount={}",
                question,
                elapsed,
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

        return new WordSearchResponse(
                true,
                results
        );
    }

    private WordAnswer toResponse(
            Document document
    ) {
        Map<String, Object> metadata = document.getMetadata();

        String word = (String) metadata.get("word");
        String category = (String) metadata.get("category");
        String wordId = (String)metadata.get("wordId");
        String meaning = "";
        Word  wordObj = wordRepository.findById(Long.parseLong(wordId)).orElse(null);
        if(wordObj != null)
            meaning = wordObj.getMeaning();

        return new WordAnswer(
                true,
                word,
                meaning,
                category,
                "신조어 '%s'는 %s라는 의미입니다."
                        .formatted(word, meaning)
        );
    }
}