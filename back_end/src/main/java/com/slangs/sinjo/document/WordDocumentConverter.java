package com.slangs.sinjo.document;

import com.slangs.sinjo.entity.Word;
import org.springframework.ai.document.Document;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class WordDocumentConverter {
    public Document convert(Word word) {

        String content = """
                word: %s
                category: %s
                meaning: %s
                example: %s
                """.formatted(
                word.getWord(),
                word.getCategory(),
                word.getMeaning(),
                word.getExample()
        );

        Map<String, Object> metadata = new HashMap<>();

        metadata.put("wordId", String.valueOf(word.getId()));
        metadata.put("word", word.getWord());
        metadata.put("category", word.getCategory());

        return Document.builder()
                .text(content)
                .metadata(metadata)
                .build();
    }
}
