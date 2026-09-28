package com.slangs.sinjo.config;

import com.slangs.sinjo.entity.PointShopItem;
import com.slangs.sinjo.repository.PointShopItemRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * REQ-MY-01: 포인트 상점 기본 카탈로그 보완.
 * <p>
 * 회귀 방지 - 예전에는 테이블에 상품이 하나라도 있으면(count() > 0) 아무것도 안 채웠는데,
 * 그 상태에서 기본 카탈로그에 새 상품(번역권 +5)이 추가돼도 영원히 안 나타나는 문제가 있었다.
 * 지금은 이름 기준으로 "빠진 것만" 채운다.
 */
@ExtendWith(MockitoExtension.class)
class PointShopItemInitializerTest {

    @Mock
    private PointShopItemRepository pointShopItemRepository;

    @InjectMocks
    private PointShopItemInitializer initializer;

    @Test
    @DisplayName("기존 상품이 하나도 없으면 기본 카탈로그 5개를 전부 채운다")
    void 테이블이_비어있으면_전부_채운다() {
        when(pointShopItemRepository.existsByName(any())).thenReturn(false);

        initializer.run(null);

        ArgumentCaptor<List<PointShopItem>> captor = ArgumentCaptor.forClass(List.class);
        verify(pointShopItemRepository).saveAll(captor.capture());
        assertThat(captor.getValue()).hasSize(5);
    }

    @Test
    @DisplayName("이미 4개 상품이 있어도, 새로 추가된 '번역권 +5'만 빠졌으면 그것만 채운다")
    void 일부만_있으면_빠진_것만_채운다() {
        // 예전 4개 COSMETIC 상품은 이미 있고, 나중에 추가된 번역권만 없는 운영 DB 상황 재현.
        when(pointShopItemRepository.existsByName("프로필 테마")).thenReturn(true);
        when(pointShopItemRepository.existsByName("닉네임 뱃지")).thenReturn(true);
        when(pointShopItemRepository.existsByName("반짝반짝 효과")).thenReturn(true);
        when(pointShopItemRepository.existsByName("VIP 뱃지")).thenReturn(true);
        when(pointShopItemRepository.existsByName("번역권 +5")).thenReturn(false);

        initializer.run(null);

        ArgumentCaptor<List<PointShopItem>> captor = ArgumentCaptor.forClass(List.class);
        verify(pointShopItemRepository).saveAll(captor.capture());
        assertThat(captor.getValue()).hasSize(1);
        assertThat(captor.getValue().get(0).getName()).isEqualTo("번역권 +5");
    }

    @Test
    @DisplayName("기본 카탈로그가 이미 전부 있으면 아무것도 저장하지 않는다")
    void 전부_있으면_저장하지_않는다() {
        when(pointShopItemRepository.existsByName(any())).thenReturn(true);

        initializer.run(null);

        verify(pointShopItemRepository, never()).saveAll(any());
    }
}
