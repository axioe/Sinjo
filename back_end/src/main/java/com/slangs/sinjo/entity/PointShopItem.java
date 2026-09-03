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

    public PointShopItem(String name, int price) {
        this.name = name;
        this.price = price;
    }

    public void update(String name, int price) {
        this.name = name;
        this.price = price;
    }
}
