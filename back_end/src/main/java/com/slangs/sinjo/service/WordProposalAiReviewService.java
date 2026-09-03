package com.slangs.sinjo.service;

import com.slangs.sinjo.entity.ProposalStatus;
import com.slangs.sinjo.entity.WordProposal;
import com.slangs.sinjo.entity.WordProposalCandidate;
import com.slangs.sinjo.entity.WordProposalReview;
import com.slangs.sinjo.exception.NotFoundException;
import com.slangs.sinjo.repository.WordProposalCandidateRepository;
import com.slangs.sinjo.repository.WordProposalRepository;
import com.slangs.sinjo.repository.WordProposalReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class WordProposalAiReviewService {

    private final ChatClient chatClient;
    private final VectorStore vectorStore;

    private final WordProposalRepository proposalRepository;
    private final WordProposalCandidateRepository candidateRepository;
    private final WordProposalReviewRepository reviewRepository;

    private final ObjectMapper objectMapper;

    private static final int TOP_K = 5;


    // =========================================================
    // AI 검수 실행
    // =========================================================

    @Transactional
    public String review(Long proposalId) {
        WordProposal proposal =
                proposalRepository.findById(proposalId)
                        .orElseThrow(() ->
                                new NotFoundException(
                                        "신조어 제안을 찾을 수 없습니다."
                                )
                        );
        /*
         * AI 검수는 관리자 검수 요청 상태에서만 실행
         */
        if (proposal.getStatus()
                != ProposalStatus.REVIEW_REQUESTED) {

            throw new IllegalStateException(
                    "관리자 검수 요청 상태에서만 AI 검수를 실행할 수 있습니다."
            );
        }
        // =====================================================
        // 1. 기존 사전 Word 검색
        // =====================================================
        List<Document> similarDocuments = searchSimilarWords(proposal);
        // =====================================================
        // 2. 후보 Word 조회
        // =====================================================
        List<WordProposalCandidate> candidates =
                candidateRepository
                        .findByProposalIdOrderByLikesDescCreatedAtAsc(
                                proposalId
                        );
        // =====================================================
        // 3. AI에게 전달할 기존 Word 정보
        // =====================================================
        String similarWords = buildSimilarWords(similarDocuments);
        // =====================================================
        // 4. AI에게 전달할 후보 Word 정보
        // =====================================================
        String candidateWords = buildCandidateWords(candidates);
        // =====================================================
        // 5. AI 검수
        // =====================================================
        String response = requestAiReview(
                        proposal,
                        similarWords,
                        candidateWords
                );
        //log.info("AI 검수 원본 응답:\n{}", response);
        // =====================================================
        // 6. JSON 검증
        // =====================================================
        String normalizedResponse = normalizeJson(response);
        // JSON 검증
       // log.info("JSON 검증 : {}", normalizedResponse);
        // =====================================================
        // 7. 기존 AI 검수 결과가 있으면 교체
        // =====================================================
        WordProposalReview review =
                reviewRepository
                        .findByProposalId(proposalId)
                        .orElseGet(() -> {
                            WordProposalReview newReview = new WordProposalReview();
                            newReview.setProposal(proposal);
                            return newReview;
                        });
        review.setRawResponse(normalizedResponse);
        reviewRepository.save(review);
        // =====================================================
        // 8. 후보 상태는 AI 검수 완료로 변경
        // =====================================================
        for (WordProposalCandidate candidate : candidates) {
            if (candidate.getStatus()
                    == com.slangs.sinjo.entity.CandidateStatus.PENDING) {
                candidate.setStatus(
                        com.slangs.sinjo.entity.CandidateStatus.AI_REVIEWED
                );
            }
        }
        // =====================================================
        // 9. 제안 상태 변경
        // =====================================================
        proposal.setStatus(
                ProposalStatus.AI_REVIEWED
        );

        return normalizedResponse;
    }


    // =========================================================
    // 기존 Word 검색
    // =========================================================

    private List<Document> searchSimilarWords(
            WordProposal proposal
    ) {

        String query = """
                word: %s
                meaning: %s
                example: %s
                """.formatted(
                proposal.getProposedWord(),
                proposal.getMeaning(),
                proposal.getExample()
        );

        SearchRequest request =
                SearchRequest.builder()
                        .query(query)
                        .topK(TOP_K)
                        .build();

        return vectorStore.similaritySearch(request);
    }


    // =========================================================
    // 기존 Word → AI 전달 문자열
    // =========================================================

    private String buildSimilarWords(
            List<Document> documents
    ) {

        if (documents == null
                || documents.isEmpty()) {

            return "유사한 기존 사전 Word를 찾지 못했습니다.";
        }

        StringBuilder result =
                new StringBuilder();

        for (int i = 0;
             i < documents.size();
             i++) {

            Document document =
                    documents.get(i);

            result.append("[기존 Word ")
                    .append(i + 1)
                    .append("]\n");

            result.append(
                    document.getText()
            );

            result.append("\n");

            result.append("metadata: ")
                    .append(document.getMetadata());

            result.append("\n\n");
        }

        return result.toString();
    }


    // =========================================================
    // 후보 Word → AI 전달 문자열
    // =========================================================

    private String buildCandidateWords(
            List<WordProposalCandidate> candidates
    ) {

        if (candidates == null
                || candidates.isEmpty()) {

            return "등록된 후보 Word가 없습니다.";
        }

        StringBuilder result =
                new StringBuilder();

        for (int i = 0;
             i < candidates.size();
             i++) {

            WordProposalCandidate candidate =
                    candidates.get(i);

            result.append("[후보 ")
                    .append(i + 1)
                    .append("]\n");

            result.append("candidateId: ")
                    .append(candidate.getId())
                    .append("\n");

            result.append("word: ")
                    .append(candidate.getWord())
                    .append("\n");

            result.append("meaning: ")
                    .append(candidate.getMeaning())
                    .append("\n");

            result.append("example: ")
                    .append(candidate.getExample())
                    .append("\n");

            result.append("description: ")
                    .append(nullToEmpty(
                            candidate.getDescription()
                    ))
                    .append("\n");

            result.append("likes: ")
                    .append(candidate.getLikes())
                    .append("\n\n");
        }

        return result.toString();
    }


    // =========================================================
    // AI 호출
    // =========================================================

    private String requestAiReview(
            WordProposal proposal,
            String similarWords,
            String candidateWords
    ) {

        String prompt = """
                당신은 한국어 신조어 사전의 전문 검수자입니다.

                사용자가 새로운 신조어를 제안했고,
                다른 사용자들이 댓글을 통해 새로운 후보 Word도 제안했습니다.

                기존 사전 Word와 사용자 제안,
                후보 Word를 모두 비교하여 관리자에게 검수 의견을 제공하세요.
                
                ================================================
                [사용자 원본 제안]
                ================================================
                proposedWord:
                %s

                meaning:
                %s

                example:
                %s

                description:
                %s

                sourceDescription:
                %s

                ================================================
                [현재 사전에 존재하는 유사 Word]
                ================================================

                %s

                ================================================
                [댓글에서 나온 후보 Word]
                ================================================

                %s

                ================================================
                [검수 기준]
                ================================================
                
                1. 원본 제안 Word가 기존 사전에 이미 존재하는지 판단하세요.
                2. 기존 Word와 사실상 같은 표현인지 판단하세요.
                3. 기존 Word와 의미가 지나치게 유사한지도 판단하세요.
                4. 원본 제안의 의미가 실제 Word의 의미에 적절한지 판단하세요.
                5. 사용 예시가 자연스러운지 판단하세요.
                6. 실제 신조어, 유행어, 줄임말, 밈, 인터넷 커뮤니티 표현 등으로 볼 가능성을 판단하세요.
                7. 단순 오타, 일반적인 단어 또는 일반 문장일 가능성이 있는지도 판단하세요.
                8. 적절한 category를 추천하세요.
                9. 댓글 후보 Word 각각에 대해서도 검수하세요.
                10. 후보 Word가 기존 사전 Word와 중복되는지도 판단하세요.
                11. 후보 Word가 실제 신조어로 등록할 가치가 있는지 판단하세요.
                12. likes 수는 사용자 관심도를 판단하는 참고자료일 뿐이며,
                    likes가 많다고 해서 반드시 적합한 것은 아닙니다.
       
                ================================================
                [중요]
                ================================================
                - Markdown 코드블록을 사용하지 마세요.
                - JSON 앞에 설명을 작성하지 마세요.
                - JSON 뒤에 설명을 작성하지 마세요.
                - 반드시 큰따옴표를 사용하세요.
                - 문자열 내부의 큰따옴표는 반드시 JSON 규칙에 따라 escape하세요.
                - trailing comma를 사용하지 마세요.
                - null이 필요한 경우에만 null을 사용하세요.
                - recommendation은 APPROVE, REVIEW, REJECT 중 하나만 사용하세요.
                
                ================================================
                [JSON 형식]
                ================================================
                
                {
                  "proposal": {
                    "duplicate": false,
                    "recommendedCategory": "인터넷",
                    "recommendation": "APPROVE",
                    "confidence": 0.91,
                    "opinion": "원본 제안에 대한 검수 의견"
                  },
                  "candidates": [
                    {
                      "candidateId": 12,
                      "duplicate": false,
                      "recommendation": "APPROVE",
                      "confidence": 0.88,
                      "opinion": "후보 Word에 대한 검수 의견"
                    }
                  ],
                  "summary": {
                    "recommendation": "APPROVE",
                    "opinion": "관리자에게 전달할 최종 검수 의견"
                  }
                }
                
                ================================================
                [recommendation 규칙]
                ================================================
                
                반드시 다음 중 하나만 사용하세요.
                APPROVE
                REVIEW
                REJECT

                APPROVE:
                사전 등록을 권장할 수 있는 경우

                REVIEW:
                판단하기 애매하거나 추가 확인이 필요한 경우

                REJECT:
                기존 Word와 중복되거나 신조어로 보기 어렵거나
                등록하기 부적절한 경우
                
                ================================================
                [최종 검수]
                ================================================
                모든 정보를 종합하여 JSON만 반환하세요.
                """.formatted(
                proposal.getProposedWord(),
                proposal.getMeaning(),
                proposal.getExample(),
                nullToEmpty(
                        proposal.getDescription()
                ),
                nullToEmpty(
                        proposal.getSourceDescription()
                ),
                similarWords,
                candidateWords
        );

        return chatClient
                .prompt()
                .user(prompt)
                .call()
                .content();
    }


    // =========================================================
    // JSON 정리 및 검증
    // =========================================================
    private String normalizeJson(String response) {

        if (response == null || response.isBlank()) {
            throw new IllegalStateException(
                    "AI 검수 결과가 비어 있습니다."
            );
        }

        String json = response.trim();

        log.debug("AI 원본 응답 길이: {}", json.length());

        // ---------------------------------------------------------
        // Markdown 코드 블록 제거
        // ---------------------------------------------------------
        if (json.startsWith("```json")) {
            json = json.substring(7).trim();

            if (json.endsWith("```")) {
                json = json.substring(0, json.length() - 3).trim();
            }
        } else if (json.startsWith("```")) {
            json = json.substring(3).trim();

            if (json.endsWith("```")) {
                json = json.substring(0, json.length() - 3).trim();
            }
        }

        // ---------------------------------------------------------
        // JSON 객체 시작 / 끝 확인
        // ---------------------------------------------------------
        int start = json.indexOf("{");
        int end = json.lastIndexOf("}");

        if (start == -1 || end == -1 || start > end) {

            log.error(
                    "AI 응답에서 JSON 객체를 찾을 수 없습니다.\n{}",
                    response
            );

            throw new IllegalStateException(
                    "AI 검수 결과에서 JSON 객체를 찾을 수 없습니다."
            );
        }

        json = json.substring(start, end + 1).trim();

        // ---------------------------------------------------------
        // JSON 파싱 검증
        // ---------------------------------------------------------
        try {

            JsonNode node = objectMapper.readTree(json);

            if (node == null || !node.isObject()) {

                throw new IllegalStateException(
                        "AI 검수 결과가 JSON 객체가 아닙니다."
                );
            }

            return json;

        } catch (Exception e) {

            log.error(
                    "AI JSON 파싱 실패\n원본 응답:\n{}\n추출 JSON:\n{}",
                    response,
                    json,
                    e
            );

            throw new IllegalStateException(
                    "AI 검수 결과 JSON 형식이 올바르지 않습니다.",
                    e
            );
        }
    }

    private String nullToEmpty(
            String value
    ) {

        return value == null
                ? ""
                : value;
    }
}