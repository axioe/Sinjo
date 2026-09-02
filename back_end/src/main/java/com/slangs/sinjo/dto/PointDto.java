package com.slangs.sinjo.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;

/** 포인트 적립/상점 (REQ-MY-01). */
public class PointDto {

    /** 마이페이지 "포인트 보유량" 카드용. */
    public record Balance(long balance) {}

    /** 상점 카탈로그 1개 항목. 프론트의 아이콘/설명/색상은 화면 전용이라 여기 없다. */
    public record ShopItem(Long id, String name, int price) {}

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
}
