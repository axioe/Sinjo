package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.SttDto;
import com.slangs.sinjo.exception.SttTranscriptionException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * REQ-STT-01: 음성 인식(Whisper 기반 STT).
 * <p>
 * RestClient 의 post().uri().header()... 체인은 대부분 자기 자신과 같은 타입을 돌려주는
 * 유창한(fluent) 인터페이스라 RETURNS_DEEP_STUBS 로 한 번에 엮으려 했는데, header 가
 * varargs(String...) 라 깊은 스텁 체인이 null 을 돌려주는 문제가 있었다. 그래서 체인의
 * 각 단계를 별도 mock 으로 명시적으로 연결한다. 실제 Whisper 연동 자체는 세션 중 curl로
 * 별도 확인했다(합성 한국어 음성 → 정확한 텍스트 반환).
 */
@ExtendWith(MockitoExtension.class)
class SttServiceTest {

    @Mock
    private RestClient restClient;

    @InjectMocks
    private SttService sttService;

    private RestClient.ResponseSpec responseSpec;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(sttService, "apiKey", "test-api-key");

        RestClient.RequestBodyUriSpec bodyUriSpec = mock(RestClient.RequestBodyUriSpec.class);
        RestClient.RequestBodySpec bodySpec = mock(RestClient.RequestBodySpec.class);
        responseSpec = mock(RestClient.ResponseSpec.class);

        lenient().when(restClient.post()).thenReturn(bodyUriSpec);
        lenient().when(bodyUriSpec.uri(anyString())).thenReturn(bodySpec);
        lenient().when(bodySpec.header(anyString(), any(String[].class))).thenReturn(bodySpec);
        lenient().when(bodySpec.contentType(any())).thenReturn(bodySpec);
        lenient().when(bodySpec.body(any(Object.class))).thenReturn(bodySpec);
        lenient().when(bodySpec.retrieve()).thenReturn(responseSpec);
    }

    private MultipartFile audio(String filename, byte[] content) {
        return new MockMultipartFile("audio", filename, "audio/wav", content);
    }

    @Nested
    @DisplayName("REQ-STT-01: 입력 검증")
    class InputValidation {

        @Test
        void 오디오가_없으면_예외() {
            assertThatThrownBy(() -> sttService.transcribe(null))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        void 빈_파일이면_예외() {
            MultipartFile empty = new MockMultipartFile("audio", "a.wav", "audio/wav", new byte[0]);

            assertThatThrownBy(() -> sttService.transcribe(empty))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Nested
    @DisplayName("REQ-STT-01: Whisper 응답 처리")
    class Transcription {

        @Test
        void 정상_응답이면_인식된_텍스트를_돌려준다() {
            when(responseSpec.body(Map.class)).thenReturn(Map.of("text", "  안녕하세요 테스트입니다  "));

            SttDto.TranscriptionResponse response = sttService.transcribe(audio("rec.wav", new byte[]{1, 2, 3}));

            assertThat(response.text()).isEqualTo("안녕하세요 테스트입니다");
        }

        @Test
        void 응답에_text가_없으면_빈_문자열을_돌려준다() {
            when(responseSpec.body(Map.class)).thenReturn(Map.of());

            SttDto.TranscriptionResponse response = sttService.transcribe(audio("rec.wav", new byte[]{1}));

            assertThat(response.text()).isEmpty();
        }

        @Test
        void Whisper_호출이_실패하면_SttTranscriptionException으로_변환된다() {
            when(responseSpec.body(Map.class)).thenThrow(new RestClientException("네트워크 오류"));

            assertThatThrownBy(() -> sttService.transcribe(audio("rec.wav", new byte[]{1})))
                    .isInstanceOf(SttTranscriptionException.class);
        }
    }
}
