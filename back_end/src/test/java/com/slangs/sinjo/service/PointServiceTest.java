package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.PointDto;
import com.slangs.sinjo.entity.PointShopItem;
import com.slangs.sinjo.entity.PointShopItemType;
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

    @Mock
    private TranslationLimitService translationLimitService;

    @InjectMocks
    private PointService pointService;

    private PointShopItem item(long id, String name, int price) {
        PointShopItem item = new PointShopItem(name, price, null, null, PointShopItemType.COSMETIC, null);
        ReflectionTestUtils.setField(item, "id", id);
        return item;
    }

    private PointShopItem translationExtraItem(long id, String name, int price, int effectValue) {
        PointShopItem item = new PointShopItem(
                name, price, null, null, PointShopItemType.TRANSLATION_EXTRA, effectValue
        );
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
    @DisplayName("REQ-MY-01: 상점 목록 조회")
    class GetShopItems {

        @Test
        void 비로그인이면_예외() {
            assertThatThrownBy(() -> pointService.getShopItems(null))
                    .isInstanceOf(UnauthorizedException.class);
        }

        @Test
        void 상품의_설명과_아이콘도_함께_내려준다() {
            PointShopItem shopItem = new PointShopItem(
                    "프로필 테마", 300, "설명입니다", "🎨", PointShopItemType.COSMETIC, null
            );
            ReflectionTestUtils.setField(shopItem, "id", 1L);
            when(pointShopItemRepository.findAllByOrderByIdAsc()).thenReturn(List.of(shopItem));
            when(pointTransactionRepository.findPurchasedItemIdsByUserId(1L)).thenReturn(List.of());

            PointDto.ShopResponse response = pointService.getShopItems(1L);

            assertThat(response.items()).hasSize(1);
            assertThat(response.items().get(0).description()).isEqualTo("설명입니다");
            assertThat(response.items().get(0).icon()).isEqualTo("🎨");
        }

        @Test
        void 번역권은_거래가_있어도_이미_구매한_목록에서_빠진다() {
            PointShopItem shopItem = translationExtraItem(1L, "번역권 +5", 200, 5);
            when(pointShopItemRepository.findAllByOrderByIdAsc()).thenReturn(List.of(shopItem));
            // 이미 오늘 한 번 산 상태를 흉내낸다 - 그래도 목록에는 안 잡혀야 한다.
            when(pointTransactionRepository.findPurchasedItemIdsByUserId(1L)).thenReturn(List.of(1L));

            PointDto.ShopResponse response = pointService.getShopItems(1L);

            assertThat(response.purchasedItemIds()).isEmpty();
        }

        @Test
        void 코스메틱_상품은_거래가_있으면_이미_구매한_목록에_남는다() {
            PointShopItem shopItem = item(1L, "프로필 테마", 300);
            when(pointShopItemRepository.findAllByOrderByIdAsc()).thenReturn(List.of(shopItem));
            when(pointTransactionRepository.findPurchasedItemIdsByUserId(1L)).thenReturn(List.of(1L));

            PointDto.ShopResponse response = pointService.getShopItems(1L);

            assertThat(response.purchasedItemIds()).containsExactly(1L);
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

        @Test
        void 번역권은_중복_구매_검사_없이_다시_살_수_있고_오늘의_한도가_늘어난다() {
            PointShopItem shopItem = translationExtraItem(1L, "번역권 +5", 200, 5);
            User user = new User();
            when(pointShopItemRepository.findById(1L)).thenReturn(Optional.of(shopItem));
            when(pointTransactionRepository.sumAmountByUserId(1L)).thenReturn(500L);
            when(userRepository.getReferenceById(1L)).thenReturn(user);

            PointDto.PurchaseResponse response = pointService.purchase(1L, 1L);

            assertThat(response.balance()).isEqualTo(300L);
            verify(translationLimitService).addBonus(1L, 5);
            // 번역권은 소모성이라 이미 산 목록 검사를 아예 건너뛰어야 한다.
            verify(pointTransactionRepository, org.mockito.Mockito.never()).findPurchasedItemIdsByUserId(1L);
        }

        @Test
        void 코스메틱_상품_구매는_번역_한도를_건드리지_않는다() {
            PointShopItem shopItem = item(1L, "프로필 테마", 300);
            User user = new User();
            when(pointShopItemRepository.findById(1L)).thenReturn(Optional.of(shopItem));
            when(pointTransactionRepository.findPurchasedItemIdsByUserId(1L)).thenReturn(List.of());
            when(pointTransactionRepository.sumAmountByUserId(1L)).thenReturn(500L);
            when(userRepository.getReferenceById(1L)).thenReturn(user);

            pointService.purchase(1L, 1L);

            verifyNoInteractions(translationLimitService);
        }
    }

    @Nested
    @DisplayName("REQ-MY-01: 상점 구매 취소")
    class CancelPurchase {

        @Test
        void 비로그인이면_예외() {
            assertThatThrownBy(() -> pointService.cancelPurchase(null, 1L))
                    .isInstanceOf(UnauthorizedException.class);
        }

        @Test
        void 존재하지_않는_상품이면_예외() {
            when(pointShopItemRepository.findById(1L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> pointService.cancelPurchase(1L, 1L))
                    .isInstanceOf(NotFoundException.class);
        }

        @Test
        void 번역권은_환불할_수_없다() {
            PointShopItem shopItem = translationExtraItem(1L, "번역권 +5", 200, 5);
            when(pointShopItemRepository.findById(1L)).thenReturn(Optional.of(shopItem));

            assertThatThrownBy(() -> pointService.cancelPurchase(1L, 1L))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("환불할 수 없는 상품입니다.");

            // 거래 조회/저장까지 가지 않고 일찍 막혀야 한다.
            verifyNoInteractions(pointTransactionRepository);
        }

        @Test
        void 구매하지_않은_상품이면_예외() {
            PointShopItem shopItem = item(1L, "프로필 테마", 300);
            when(pointShopItemRepository.findById(1L)).thenReturn(Optional.of(shopItem));
            when(pointTransactionRepository.sumAmountByUserIdAndItemId(1L, 1L)).thenReturn(0L);

            assertThatThrownBy(() -> pointService.cancelPurchase(1L, 1L))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("구매하지 않은 상품입니다.");
        }

        @Test
        void 정상_취소시_낸_만큼_환불되고_잔액이_반영된다() {
            PointShopItem shopItem = item(1L, "프로필 테마", 300);
            User user = new User();
            when(pointShopItemRepository.findById(1L)).thenReturn(Optional.of(shopItem));
            when(pointTransactionRepository.sumAmountByUserIdAndItemId(1L, 1L)).thenReturn(-300L);
            when(userRepository.getReferenceById(1L)).thenReturn(user);
            when(pointTransactionRepository.sumAmountByUserId(1L)).thenReturn(200L);

            PointDto.PurchaseResponse response = pointService.cancelPurchase(1L, 1L);

            assertThat(response.balance()).isEqualTo(200L);
            assertThat(response.itemName()).isEqualTo("프로필 테마");

            ArgumentCaptor<PointTransaction> captor = ArgumentCaptor.forClass(PointTransaction.class);
            verify(pointTransactionRepository).save(captor.capture());
            assertThat(captor.getValue().getAmount()).isEqualTo(300);
            assertThat(captor.getValue().getReason()).isEqualTo("포인트 상점 구매 취소: 프로필 테마");
        }

        @Test
        void 상품_가격이_바뀌었어도_실제로_낸_금액만큼만_환불된다() {
            // 구매 당시 300P 였다가 관리자가 500P 로 올린 상황을 가정 - 현재가가 아니라
            // sumAmountByUserIdAndItemId(구매 시점 거래 합계)를 기준으로 환불해야 한다.
            PointShopItem shopItem = item(1L, "프로필 테마", 500);
            User user = new User();
            when(pointShopItemRepository.findById(1L)).thenReturn(Optional.of(shopItem));
            when(pointTransactionRepository.sumAmountByUserIdAndItemId(1L, 1L)).thenReturn(-300L);
            when(userRepository.getReferenceById(1L)).thenReturn(user);
            when(pointTransactionRepository.sumAmountByUserId(1L)).thenReturn(300L);

            pointService.cancelPurchase(1L, 1L);

            ArgumentCaptor<PointTransaction> captor = ArgumentCaptor.forClass(PointTransaction.class);
            verify(pointTransactionRepository).save(captor.capture());
            assertThat(captor.getValue().getAmount()).isEqualTo(300);
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

    @Nested
    @DisplayName("REQ-POINT-03: 포인트 사용 내역 조회")
    class History {

        private PointTransaction transaction(long id, int amount, String reason) {
            PointTransaction transaction = new PointTransaction(new User(), amount, reason, null);
            ReflectionTestUtils.setField(transaction, "id", id);
            return transaction;
        }

        @Test
        void 비로그인이면_예외() {
            assertThatThrownBy(() -> pointService.getHistory(null))
                    .isInstanceOf(UnauthorizedException.class);
        }

        @Test
        void 로그인_사용자는_거래_내역을_최신순으로_받는다() {
            when(pointTransactionRepository.findByUser_IdOrderByCreatedAtDesc(1L)).thenReturn(List.of(
                    transaction(2L, -300, "포인트 상점 구매: 프로필 테마"),
                    transaction(1L, 10, "번역 저장")
            ));

            PointDto.HistoryResponse response = pointService.getHistory(1L);

            assertThat(response.items()).extracting(PointDto.HistoryItem::id).containsExactly(2L, 1L);
            assertThat(response.items()).extracting(PointDto.HistoryItem::amount).containsExactly(-300, 10);
            assertThat(response.items()).extracting(PointDto.HistoryItem::reason)
                    .containsExactly("포인트 상점 구매: 프로필 테마", "번역 저장");
        }

        @Test
        void 거래가_없으면_빈_목록을_받는다() {
            when(pointTransactionRepository.findByUser_IdOrderByCreatedAtDesc(1L)).thenReturn(List.of());

            PointDto.HistoryResponse response = pointService.getHistory(1L);

            assertThat(response.items()).isEmpty();
        }
    }
}
