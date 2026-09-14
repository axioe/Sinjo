package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.PointDto;
import com.slangs.sinjo.entity.PointShopItem;
import com.slangs.sinjo.entity.PointTransaction;
import com.slangs.sinjo.entity.User;
import com.slangs.sinjo.exception.NotFoundException;
import com.slangs.sinjo.exception.UnauthorizedException;
import com.slangs.sinjo.repository.PointShopItemRepository;
import com.slangs.sinjo.repository.PointTransactionRepository;
import com.slangs.sinjo.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * REQ-MY-01: 포인트 적립/상점 구매.
 * <p>
 * 가격을 서버가 최종 검증하는 이유(PointService 주석 참고)와 중복 구매 방지 로직이
 * 실제로 지켜지는지가 핵심이라, 이 두 가지에 초점을 둔다.
 */
@ExtendWith(MockitoExtension.class)
class PointServiceTest {

    @Mock
    private PointTransactionRepository pointTransactionRepository;

    @Mock
    private PointShopItemRepository pointShopItemRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PointService pointService;

    private PointShopItem item(long id, String name, int price) {
        PointShopItem item = new PointShopItem(name, price);
        ReflectionTestUtils.setField(item, "id", id);
        return item;
    }

    @Nested
    @DisplayName("REQ-MY-01: 포인트 적립")
    class Earn {

        @Test
        void 비로그인이면_조용히_무시된다() {
            pointService.earn(null, 100, "번역 저장");

            verifyNoInteractions(pointTransactionRepository);
        }

        @Test
        void 포인트가_0이하면_무시된다() {
            pointService.earn(1L, 0, "번역 저장");

            verifyNoInteractions(pointTransactionRepository);
        }

        @Test
        void 정상_적립시_저장된다() {
            User user = new User();
            when(userRepository.getReferenceById(1L)).thenReturn(user);

            pointService.earn(1L, 10, "번역 저장");

            ArgumentCaptor<PointTransaction> captor = ArgumentCaptor.forClass(PointTransaction.class);
            verify(pointTransactionRepository).save(captor.capture());
            assertThat(captor.getValue().getAmount()).isEqualTo(10);
            assertThat(captor.getValue().getReason()).isEqualTo("번역 저장");
        }
    }

    @Nested
    @DisplayName("REQ-MY-01: 상점 구매")
    class Purchase {

        @Test
        void 비로그인이면_예외() {
            assertThatThrownBy(() -> pointService.purchase(null, 1L))
                    .isInstanceOf(UnauthorizedException.class);
        }

        @Test
        void 존재하지_않는_상품이면_예외() {
            when(pointShopItemRepository.findById(1L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> pointService.purchase(1L, 1L))
                    .isInstanceOf(NotFoundException.class);
        }

        @Test
        void 이미_구매한_상품이면_예외() {
            PointShopItem shopItem = item(1L, "프로필 테마", 300);
            when(pointShopItemRepository.findById(1L)).thenReturn(Optional.of(shopItem));
            when(pointTransactionRepository.findPurchasedItemIdsByUserId(1L)).thenReturn(List.of(1L));

            assertThatThrownBy(() -> pointService.purchase(1L, 1L))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("이미 구매한 상품입니다.");
        }

        @Test
        void 포인트가_부족하면_예외() {
            PointShopItem shopItem = item(1L, "프로필 테마", 300);
            when(pointShopItemRepository.findById(1L)).thenReturn(Optional.of(shopItem));
            when(pointTransactionRepository.findPurchasedItemIdsByUserId(1L)).thenReturn(List.of());
            when(pointTransactionRepository.sumAmountByUserId(1L)).thenReturn(100L);

            assertThatThrownBy(() -> pointService.purchase(1L, 1L))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("포인트가 부족합니다.");
        }

        @Test
        void 정상_구매시_잔액이_차감되고_음수_거래가_저장된다() {
            PointShopItem shopItem = item(1L, "프로필 테마", 300);
            User user = new User();
            when(pointShopItemRepository.findById(1L)).thenReturn(Optional.of(shopItem));
            when(pointTransactionRepository.findPurchasedItemIdsByUserId(1L)).thenReturn(List.of());
            when(pointTransactionRepository.sumAmountByUserId(1L)).thenReturn(500L);
            when(userRepository.getReferenceById(1L)).thenReturn(user);

            PointDto.PurchaseResponse response = pointService.purchase(1L, 1L);

            assertThat(response.balance()).isEqualTo(200L);
            assertThat(response.itemName()).isEqualTo("프로필 테마");

            ArgumentCaptor<PointTransaction> captor = ArgumentCaptor.forClass(PointTransaction.class);
            verify(pointTransactionRepository).save(captor.capture());
            assertThat(captor.getValue().getAmount()).isEqualTo(-300);
        }
    }

    @Nested
    @DisplayName("REQ-MY-01: 잔액 조회")
    class Balance {

        @Test
        void 비로그인이면_예외() {
            assertThatThrownBy(() -> pointService.getBalance(null))
                    .isInstanceOf(UnauthorizedException.class);
        }

        @Test
        void 로그인_사용자는_잔액을_받는다() {
            when(pointTransactionRepository.sumAmountByUserId(1L)).thenReturn(1000L);

            PointDto.Balance balance = pointService.getBalance(1L);

            assertThat(balance.balance()).isEqualTo(1000L);
        }
    }
}
