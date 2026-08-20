package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.WordQuery;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class WordQueryAnalyzer {
    private final ChatClient chatClient;

    public WordQueryAnalyzer(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }

    public WordQuery analyze(
            String question,
            List<String> categories
    ) {

        String categoryList = String.join(", ", categories);

        return chatClient.prompt()
                .system("""
                        당신은 한국어 신조어 검색 Query Analyzer입니다.

                        사용자의 질문을 다음 유형 중 정확히 하나로 분류하세요.

                        WORD:
                        특정 신조어의 뜻이나 의미를 묻는 질문

                        MEANING:
                        특정 의미에 해당하는 신조어를 묻는 질문

                        CATEGORY:
                        특정 카테고리에 속하는 신조어를 묻는 질문

                        EXAMPLE:
                        특정 신조어의 예제나 사용법을 묻는 질문

                        규칙:

                        1. word은 사용자가 특정 신조어를 명시한 경우에만 작성하세요.
                        2. category는 아래 카테고리 목록에 존재하는 경우에만 작성하세요.
                        3. 존재하지 않는 category를 만들어내지 마세요.
                        4. 모호하면 null을 사용하세요.

                        사용 가능한 카테고리:
                        %s
                        """.formatted(categoryList))
                .user(question)
                .call()
                .entity(WordQuery.class);
    }
}
