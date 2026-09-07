package com.slangs.sinjo.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.slangs.sinjo.entity.ProposalStatus;
import com.slangs.sinjo.entity.WordProposal;
import com.slangs.sinjo.entity.WordProposalReview;
import com.slangs.sinjo.repository.WordProposalRepository;
import com.slangs.sinjo.repository.WordProposalReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WordProposalAiReviewService {

    private final WordProposalRepository proposalRepository;
    private final WordProposalReviewRepository reviewRepository;
    private final VectorStore vectorStore;
    private final ChatClient.Builder chatClientBuilder;
    private final ObjectMapper objectMapper;

    /**
     * 제안에 대한 AI 검수를 실행한다.
     *
     * 검수 대상은 현재 WordProposal 자체이며,
     * 별도의 후보 Word를 생성하거나 검수하지 않는다.
     */
    @Transactional
    public WordProposalReview executeReview(Long proposalId) {
        WordProposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() ->
                        new IllegalArgumentException("제안을 찾을 수 없습니다."));

        if (proposal.getStatus() != ProposalStatus.REVIEW_REQUESTED) {
            throw new IllegalStateException(
                    "검수 요청 상태의 제안만 AI 검수를 실행할 수 있습니다."
            );
        }

        /*
         * 기존 Word와 유사한 단어를 검색한다.
         * AI에게 중복 가능성을 판단할 수 있는 참고 자료로 전달한다.
         */
        List<Document> similarDocuments = findSimilarWords(proposal);

        String prompt = buildPrompt(proposal, similarDocuments);

        ChatClient chatClient = chatClientBuilder.build();

        String response = chatClient.prompt()
                .user(prompt)
                .call()
                .content();

        if (response == null || response.isBlank()) {
            throw new IllegalStateException(
                    "AI 검수 결과가 비어 있습니다."
            );
        }

        JsonNode root = parseJson(normalizeJson(response));

        WordProposalReview review = saveReview(proposal, root);

        proposal.setStatus(ProposalStatus.AI_REVIEWED);

        return review;
    }

    /**
     * 기존 등록 단어 중 제안 단어와 의미적으로 유사한 단어를 검색한다.
     */
    private List<Document> findSimilarWords(WordProposal proposal) {
        try {
            return vectorStore.similaritySearch(
                            proposal.getProposedWord()
                    ).stream()
                    .limit(3)
                    .toList();
        } catch (Exception e) {
            /*
             * VectorStore 검색 실패가 전체 AI 검수를 막지 않도록
             * 빈 목록으로 처리한다.
             */
            return List.of();
        }
    }

    private String buildPrompt(
            WordProposal proposal,
            List<Document> similarDocuments
    ) {
        String similarWords = similarDocuments.isEmpty()
                ? "유사한 기존 단어가 없습니다."
                : similarDocuments.stream()
                  .map(this::documentToText)
                  .collect(Collectors.joining("\n"));

        return """
                당신은 한국어 신조어/유행어 사전의 전문 검수자입니다.

                아래 사용자가 제안한 단어를 검수하세요.

                [제안 단어]
                단어: %s
                의미: %s
                사용 예시: %s
                설명: %s
                출처 설명: %s

                [기존 사전에 등록된 유사 단어]
                %s

                다음 기준으로 검수하세요.

                1. 기존 사전에 동일하거나 사실상 동일한 단어가 있는지 판단하세요.
                2. 의미와 실제 사용 맥락을 고려하여 적절한 카테고리를 추천하세요.
                3. 제안을 승인할지 반려할지 판단하세요.
                4. 판단에 대한 구체적인 검수 의견을 작성하세요.
                5. confidence는 0.0 ~ 1.0 사이의 숫자로 작성하세요.
                6. summary에는 관리자가 최종 판단할 때 참고할 수 있는 간결한 의견을 작성하세요.
                7. 후보 단어를 만들거나 후보를 선택하지 마세요.
                8. 반드시 아래 JSON 형식만 반환하세요.
                9. Markdown 코드 블록이나 설명 문장은 반환하지 마세요.

                반환 형식:
                {
                  "proposal": {
                    "duplicate": false,
                    "recommendedCategory": "인터넷",
                    "recommendation": "APPROVE",
                    "confidence": 0.91,
                    "opinion": "검수 의견"
                  },
                  "summary": {
                    "recommendation": "APPROVE",
                    "opinion": "관리자에게 전달할 최종 검수 의견"
                  }
                }

                recommendation은 반드시 APPROVE 또는 REJECT 중 하나를 사용하세요.
                """.formatted(
                safe(proposal.getProposedWord()),
                safe(proposal.getMeaning()),
                safe(proposal.getExample()),
                safe(proposal.getDescription()),
                safe(proposal.getSourceDescription()),
                similarWords
        );
    }

    private String documentToText(Document document) {
        if (document == null) {
            return "";
        }

        String text = document.getText();

        if (text == null || text.isBlank()) {
            return "";
        }

        return text.trim();
    }

    /**
     * AI 응답에서 JSON 부분만 추출한다.
     *
     * ```json ... ``` 형태나 앞뒤 설명이 포함되어도
     * 실제 JSON 객체 부분을 찾아낼 수 있도록 처리한다.
     */
    private String normalizeJson(String response) {
        String normalized = response
                .replace("```json", "")
                .replace("```JSON", "")
                .replace("```", "")
                .trim();

        int start = normalized.indexOf('{');
        int end = normalized.lastIndexOf('}');

        if (start < 0 || end < start) {
            throw new IllegalStateException(
                    "AI 응답에서 JSON을 찾을 수 없습니다."
            );
        }

        return normalized.substring(start, end + 1);
    }

    private JsonNode parseJson(String json) {
        try {
            return objectMapper.readTree(json);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(
                    "AI 검수 결과 JSON을 파싱할 수 없습니다.",
                    e
            );
        }
    }

    private WordProposalReview saveReview(
            WordProposal proposal,
            JsonNode root
    ) {
        JsonNode proposalNode = root.path("proposal");
        JsonNode summaryNode = root.path("summary");

        if (proposalNode.isMissingNode() || summaryNode.isMissingNode()) {
            throw new IllegalStateException(
                    "AI 검수 결과에 proposal 또는 summary가 없습니다."
            );
        }

        boolean duplicate = proposalNode.path("duplicate").asBoolean(false);

        String recommendedCategory =
                textValue(proposalNode, "recommendedCategory");

        String recommendation =
                textValue(proposalNode, "recommendation");

        Double confidence =
                doubleValue(proposalNode, "confidence");

        String opinion =
                textValue(proposalNode, "opinion");

        String summaryRecommendation =
                textValue(summaryNode, "recommendation");

        String summaryOpinion =
                textValue(summaryNode, "opinion");

        /*
         * 기존 AI 검수 결과가 있다면 교체한다.
         * proposal_id는 WordProposalReview에서 unique이다.
         */
        WordProposalReview review =
                reviewRepository.findByProposalId(proposal.getId())
                            .orElseGet(WordProposalReview::new);

        review.setProposal(proposal);
        review.setDuplicate(duplicate);
        review.setRecommendedCategory(recommendedCategory);
        review.setRecommendation(recommendation);
        review.setConfidence(confidence);
        review.setOpinion(opinion);
        review.setSummaryRecommendation(summaryRecommendation);
        review.setSummaryOpinion(summaryOpinion);

        return reviewRepository.save(review);
    }

    private String textValue(JsonNode node, String fieldName) {
        JsonNode value = node.get(fieldName);

        if (value == null || value.isNull()) {
            return null;
        }

        String text = value.asText();

        return text == null || text.isBlank()
                ? null
                : text.trim();
    }

    private Double doubleValue(JsonNode node, String fieldName) {
        JsonNode value = node.get(fieldName);

        if (value == null || value.isNull() || !value.isNumber()) {
            return null;
        }

        return value.asDouble();
    }

    private String safe(String value) {
        return value == null || value.isBlank()
                ? "(없음)"
                : value;
    }
}
