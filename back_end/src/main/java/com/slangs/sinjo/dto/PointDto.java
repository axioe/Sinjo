package com.slangs.sinjo.dto;

import com.slangs.sinjo.entity.PointShopItemType;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;

/** 포인트 적립/상점 (REQ-MY-01). */
public class PointDto {

    /** 마이페이지 "포인트 보유량" 카드용. */
    public record Balance(long balance) {}

    /**
     * 상점 카탈로그 1개 항목. 색상 테마는 프론트가 id로 순환 결정하는 화면 전용 값이라 여기 없다.
     * type=TRANSLATION_EXTRA 일 때만 effectValue(구매 1회당 늘어나는 오늘의 번역 가능 횟수)가 채워진다.
     */
    public record ShopItem(
            Long id, String name, int price, String description, String icon,
            PointShopItemType type, Integer effectValue
    ) {}

    /**
     * 상점 목록 응답.
     * purchasedItemIds 는 이미 산 항목이다 - 프론트가 "구매 완료" 상태를 새로고침 후에도
     * 유지하는 데 쓴다(이전엔 새로고침하면 사라지는 화면 상태였다).
     */
    public record ShopResponse(List<ShopItem> items, List<Long> purchasedItemIds) {}

    public record PurchaseRequest(
            @NotNull(message = "구매할 상품을 선택해 주세요.")
            Long itemId
    ) {}

    public record PurchaseResponse(long balance, String itemName) {}

    /** 포인트 사용 내역 1건. amount 는 양수 = 적립, 음수 = 사용(PointTransaction 과 동일). */
    public record HistoryItem(Long id, int amount, String reason, LocalDateTime createdAt) {}

    /** 마이페이지 "포인트 사용 내역" 응답 - 최신순. */
    public record HistoryResponse(List<HistoryItem> items) {}
}
