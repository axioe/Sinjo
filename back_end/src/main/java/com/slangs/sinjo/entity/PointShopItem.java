package com.slangs.sinjo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 포인트 상점 카탈로그 항목 (REQ-MY-01, REQ-ADM-01).
 * <p>
 * 원래 PointService 안에 고정 Map(SHOP_ITEMS)으로 있던 상점 목록을 관리자가
 * 화면에서 추가/수정할 수 있도록 테이블로 옮긴 것이다. PointTransaction.itemId 는
 * 이 엔티티를 FK 가 아니라 참고용 Long 으로만 들고 있다(Favorites.wordId 와 같은
 * 방식) - 항목을 지워도 이미 구매한 기록의 "포인트 상점 구매: 상품명" 문구는
 * 그대로 남고, 목록에서만 사라진다.
 */
@Entity
@Table(name = "point_shop_items")
@Getter
@NoArgsConstructor
public class PointShopItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false)
    private int price;

    @Column(length = 300)
    private String description;

    /** 이모지 한두 글자. 비어 있으면 프론트가 기본 아이콘(🎁)으로 대체한다. */
    @Column(length = 8)
    private String icon;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PointShopItemType type = PointShopItemType.COSMETIC;

    /** type=TRANSLATION_EXTRA 일 때만 의미가 있다 - 구매 1회당 늘어나는 오늘의 번역 가능 횟수. */
    @Column(name = "effect_value")
    private Integer effectValue;

    public PointShopItem(
            String name, int price, String description, String icon,
            PointShopItemType type, Integer effectValue
    ) {
        this.name = name;
        this.price = price;
        this.description = description;
        this.icon = icon;
        this.type = type;
        this.effectValue = effectValue;
    }

    public void update(
            String name, int price, String description, String icon,
            PointShopItemType type, Integer effectValue
    ) {
        this.name = name;
        this.price = price;
        this.description = description;
        this.icon = icon;
        this.type = type;
        this.effectValue = effectValue;
    }

    public boolean isTranslationExtra() {
        return type == PointShopItemType.TRANSLATION_EXTRA;
    }
}
