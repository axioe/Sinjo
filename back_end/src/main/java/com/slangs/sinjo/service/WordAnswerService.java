package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.WordAnswer;
import com.slangs.sinjo.entity.Word;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class WordAnswerService {

    private final ChatClient chatClient;

    /**
     * PVector 검색 성공
     * +
     * 실제 DB 데이터
     * +
     * LLM
     */
    public WordAnswer answer(
            String question,
            List<Document> documents,
            Word word
    ) {

        String context = """
                신조어: %s
                카테고리: %s
                의미: %s
                예문: %s
                """
                .formatted(
                        word.getWord(),
                        word.getCategory(),
                        word.getMeaning(),
                        word.getExample()
                );

        String prompt = """
                당신은 한국 신조어 전문 AI입니다.

                [신조어 DB 정보]
                %s

                [사용자 질문]
                %s

                다음 규칙을 반드시 지켜주세요.

                1. 반드시 DB 정보를 기준으로 답변하세요.
                2. DB의 의미를 임의로 변경하지 마세요.
                3. 사용자가 뜻을 물으면 의미를 쉽게 설명하세요.
                4. 사용자가 사용법을 물으면 DB의 예문을 참고하세요.
                5. DB에 없는 사실을 만들어내지 마세요.
                6. 너무 길게 답변하지 마세요.
                7. 한국어로 답변하세요.

                답변:
                """
                .formatted(
                        context,
                        question
                );

        String answer =
                chatClient
                        .prompt()
                        .user(prompt)
                        .call()
                        .content();

        return new WordAnswer(
                true,
                word.getWord(),
                word.getMeaning(),
                word.getCategory(),
                answer
        );
    }


    /**
     * PVector / DB에서 관련 데이터를 찾지 못한 경우
     */
    public WordAnswer answerWithoutContext(
            String question
    ) {

        String prompt = """
                당신은 한국 신조어 전문 AI입니다.

                사용자의 질문에 답변해주세요.

                질문:
                %s

                규칙:

                1. 확실하지 않은 신조어는 만들어내지 마세요.
                2. 확인할 수 없는 의미는 추측하지 마세요.
                3. 모르는 경우 솔직하게 알려주세요.
                4. 한국어로 답변하세요.
                5. 짧고 이해하기 쉽게 답변하세요.

                답변:
                """
                .formatted(question);

        String answer =
                chatClient
                        .prompt()
                        .user(prompt)
                        .call()
                        .content();

        return new WordAnswer(
                false,
                null,
                null,
                null,
                answer
        );
    }
}