package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.SttDto;
import com.slangs.sinjo.exception.SttTranscriptionException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

/**
 * 음성 인식(STT, REQ-TR-STT).
 * <p>
 * Spring AI 의 ChatModel/EmbeddingModel(WordRagService 참고)과 달리 오디오 인식은
 * 이 프로젝트가 쓰는 spring-ai-openai 2.0.0 에 안정된 추상화가 없어서, NaverService 와
 * 같은 방식으로 Whisper REST 엔드포인트를 RestClient 로 직접 호출한다.
 */
@Service
@Slf4j
public class SttService {

    private final RestClient restClient = RestClient.create();

    @Value("${spring.ai.openai.api-key}")
    private String apiKey;

    /**
     * 오디오 파일을 Whisper 로 보내 인식된 텍스트를 받는다.
     * language 를 "ko" 로 고정한다 - 이 서비스가 다루는 발화는 한국어 신조어뿐이라
     * 자동 감지 단계를 건너뛰는 편이 더 빠르고 정확하다.
     */
    public SttDto.TranscriptionResponse transcribe(MultipartFile audio) {
        if (audio == null || audio.isEmpty()) {
            throw new IllegalArgumentException("녹음된 오디오가 없습니다.");
        }

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", toResource(audio));
        body.add("model", "whisper-1");
        body.add("language", "ko");
        body.add("response_format", "json");

        try {
            Map<?, ?> response = restClient.post()
                    .uri("https://api.openai.com/v1/audio/transcriptions")
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            String text = response == null ? null : (String) response.get("text");
            return new SttDto.TranscriptionResponse(text == null ? "" : text.trim());
        } catch (RestClientException e) {
            log.warn("[STT] Whisper 호출 실패", e);
            throw new SttTranscriptionException("음성 인식에 실패했습니다. 잠시 후 다시 시도해 주세요.", e);
        }
    }

    /** MultipartFile 은 그대로 넘기면 파일명이 없어 Whisper 가 형식을 못 알아본다. */
    private ByteArrayResource toResource(MultipartFile audio) {
        byte[] bytes;
        try {
            bytes = audio.getBytes();
        } catch (IOException e) {
            throw new SttTranscriptionException("오디오 파일을 읽지 못했습니다.", e);
        }

        String filename = audio.getOriginalFilename();
        String safeFilename = (filename == null || filename.isBlank()) ? "recording.webm" : filename;

        return new ByteArrayResource(bytes) {
            @Override
            public String getFilename() {
                return safeFilename;
            }
        };
    }
}
