package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.WordAnswer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.stereotype.Service;

import javax.print.Doc;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
public class WordAnswerService {
    private final ChatClient chatClient;

    public WordAnswerService(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }

    public WordAnswer answer(
            String question,
            List<Document> documents
    ) {

        String context = documents.stream()
                .map(Document::getText)
                .collect(Collectors.joining("\n\n"));

//        return chatClient.prompt()
//                .system("""
//                          당신은 한국어 신조어 사전 질의응답 시스템입니다.
//
//                          반드시 CONTEXT에 존재하는 정보만 사용하세요.
//
//                          절대로 자신의 일반 지식으로 신조어를 추가하지 마세요.
//
//                          CONTEXT에 질문과 관련된 정보가 있으면:
//
//                          found = true
//
//                          로 답변하세요.
//
//                          CONTEXT에 관련 정보가 없으면:
//
//                          found = false
//                          word = null
//                          meaning = null
//                          category = null
//                          answer = "사전에 없는 내용입니다."
//
//                          로 답변하세요.
//
//                          사용자의 질문에 맞게 다음을 처리하세요.
//
//                          - 신조어의 의미 질문 → 신조어와 의미 설명
//                          - 특정 의미의 신조어 질문 → 가장 적절한 신조어 설명
//                          - 카테고리 질문 → 해당 카테고리의 신조어 설명
//                          - 예제 질문 → 사전에 있는 예제를 설명
//
//                          검색 결과가 여러 개라면 질문과 가장 관련성이 높은
//                          정보를 우선해서 답변하세요.
//                        """)
//                .user("""
//                        <CONTEXT>
//                        %s
//                        </CONTEXT>
//
//                        <QUESTION>
//                        %s
//                        </QUESTION>
//                        """.formatted(context, question))
//                .call()
//                .entity(
//                        WordAnswer.class,
//                        spec -> spec.validateSchema()
//                );
//    }
        long start = System.currentTimeMillis();

        WordAnswer result = chatClient.prompt()
                .system("""
                        신조어 사전의 CONTEXT만 사용하여 답변하세요.
                        
                        CONTEXT에 질문과 관련된 내용이 없으면
                        반드시 "사전에 없는 내용입니다."라고 답하세요.
                        
                        자신의 일반 지식을 사용하지 마세요.
                        """)
                .user("""
                        CONTEXT:
                        %s
                        
                        QUESTION:
                        %s
                        """.formatted(context, question))
                .call()
                .entity(WordAnswer.class);

        long elapsed = System.currentTimeMillis() - start;

        log.info(
                "[RAG] LLM Answer - {} ms",
                elapsed
        );

        return result;
    }
}
