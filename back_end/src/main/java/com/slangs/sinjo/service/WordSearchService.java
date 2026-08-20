package com.slangs.sinjo.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
public class WordSearchService {
    private final VectorStore vectorStore;

    public WordSearchService(VectorStore vectorStore) {
        this.vectorStore = vectorStore;
    }

    public List<Document> search(
            String query,
            int topK
    ) {


        long start = System.currentTimeMillis();

        List<Document> documents = vectorStore.similaritySearch(
                SearchRequest.builder()
                        .query(query)
                        .topK(topK)
                        //.similarityThreshold(0.5)
                        .build()
        );

        long elapsed = System.currentTimeMillis() - start;

        log.info(
                "[RAG] Vector Search - {} ms, resultCount={}",
                elapsed,
                documents.size()
        );

        return documents;
    }

    public List<Document> searchByCategory(
            String query,
            String category,
            int topK
    ) {

        return vectorStore.similaritySearch(
                SearchRequest.builder()
                        .query(query)
                        .topK(topK)
                        .similarityThreshold(0.3)
                        .filterExpression(
                                "category == '" + escape(category) + "'"
                        )
                        .topK(topK)
                        .build()
        );
    }

    private String escape(String value) {
        return value.replace("'", "''");
    }
}
