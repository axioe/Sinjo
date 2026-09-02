package com.slangs.sinjo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 포인트 적립/사용 내역 1건 (REQ-MY-01).
 * <p>
 * 보유 포인트를 별도 컬럼으로 관리하지 않고, 이 거래 내역의 합으로 계산한다
 * (PointTransactionRepository.sumAmountByUserId 참고) - 잔액 컬럼과 내역이
 * 서로 어긋나는 문제를 원천적으로 없앤다.
 */
@Entity
@Table(name = "point_transactions")
@Getter
@NoArgsConstructor
public class PointTransaction extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** 양수 = 적립, 음수 = 사용. */
    @Column(nullable = false)
    private int amount;

    @Column(nullable = false, length = 200)
    private String reason;

    /** 상점 구매 거래일 때만 채워진다(PointService.SHOP_ITEMS 의 id). 적립 거래는 null. */
    @Column(name = "item_id")
    private Long itemId;

    public PointTransaction(User user, int amount, String reason, Long itemId) {
        this.user = user;
        this.amount = amount;
        this.reason = reason;
        this.itemId = itemId;
    }
}
