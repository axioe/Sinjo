package com.slangs.sinjo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

/**
 * 외부 REST API(Whisper 등)를 호출하는 서비스가 쓰는 공용 RestClient 빈.
 * <p>
 * SttService 는 원래 `private final RestClient restClient = RestClient.create();` 처럼
 * 필드 초기화로 만들어 썼는데, 이러면 생성자 주입이 아니라서 단위 테스트에서 Mock으로
 * 바꿔치기할 수 없다(Mockito @InjectMocks 는 생성자/세터로만 주입한다). 동작은 완전히
 * 동일하게 유지하면서 빈으로 등록해 생성자 주입이 되게 한다.
 */
@Configuration
public class RestClientConfig {

    @Bean
    public RestClient restClient() {
        return RestClient.create();
    }
}
