package com.slangs.sinjo.service;

import com.slangs.sinjo.document.WordDocumentConverter;
import com.slangs.sinjo.repository.WordRepository;
import jakarta.transaction.Transactional;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WordIndexService {
    private final WordRepository wordRepository;
    private final WordDocumentConverter converter;
    private final VectorStore vectorStore;

    public WordIndexService(
            WordRepository wordRepository,
            WordDocumentConverter converter,
            VectorStore vectorStore
    ) {
        this.wordRepository = wordRepository;
        this.converter = converter;
        this.vectorStore = vectorStore;
    }

    @Transactional
    public void indexAll() {

        List<Document> documents = wordRepository.findAll()
                .stream()
                .map(converter::convert)
                .toList();

        vectorStore.add(documents);
    }
}
