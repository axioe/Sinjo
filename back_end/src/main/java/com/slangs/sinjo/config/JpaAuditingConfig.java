package com.slangs.sinjo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * JPA Auditing(BaseEntity.createdAt/updatedAt) 설정.
 * <p>
 * 원래 SinjoApplication 에 @EnableJpaAuditing 이 직접 붙어 있었는데, @WebMvcTest 같은
 * 슬라이스 테스트는 메인 애플리케이션 클래스를 설정 소스로 그대로 가져다 쓴다.
 * 그 결과 슬라이스 테스트에 DataSource/EntityManagerFactory 가 전혀 없는데도
 * JpaAuditingRegistrar 가 jpaMappingContext 빈을 만들려다 "JPA metamodel must not be
 * empty" 로 컨텍스트 로딩 자체가 실패했다. 이 애노테이션을 별도 설정 클래스로 옮기면
 * 동작은 완전히 동일하게 유지하면서, JPA 와 무관한 슬라이스 테스트에는 영향을 주지 않는다.
 */
@Configuration
@EnableJpaAuditing
public class JpaAuditingConfig {
}
