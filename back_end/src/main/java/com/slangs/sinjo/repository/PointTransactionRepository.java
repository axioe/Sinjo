package com.slangs.sinjo.repository;

import com.slangs.sinjo.entity.PointTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PointTransactionRepository extends JpaRepository<PointTransaction, Long> {

    /**
     * 보유 포인트. 거래가 하나도 없으면 SUM 이 NULL 이라 COALESCE 로 0 을 대신 돌려준다.
     */
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM PointTransaction p WHERE p.user.id = :userId")
    long sumAmountByUserId(@Param("userId") Long userId);

    /**
     * 현재 보유 중인(구매 후 취소하지 않은) 상점 아이템 id 목록.
     * 구매(-가격)와 취소 환불(+가격)이 같은 itemId 로 쌓이므로, 합계가 여전히 음수인
     * 항목만 "보유 중"으로 본다 - 취소 후 재구매하면 다시 음수가 되어 목록에 돌아온다.
     */
    @Query("SELECT p.itemId FROM PointTransaction p WHERE p.user.id = :userId AND p.itemId IS NOT NULL "
            + "GROUP BY p.itemId HAVING SUM(p.amount) < 0")
    List<Long> findPurchasedItemIdsByUserId(@Param("userId") Long userId);

    /** 특정 상품에 대해 이 사용자가 쌓은 거래 합계 - 구매 취소 시 정확히 얼마를 돌려줘야 하는지 계산하는 데 쓴다. */
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM PointTransaction p WHERE p.user.id = :userId AND p.itemId = :itemId")
    long sumAmountByUserIdAndItemId(@Param("userId") Long userId, @Param("itemId") Long itemId);

    /** 마이페이지 "포인트 사용 내역" 목록 - 최신순. */
    List<PointTransaction> findByUser_IdOrderByCreatedAtDesc(Long userId);

    /** 관리자가 회원을 삭제할 때 먼저 지운다 - user_id 가 FK(nullable = false)라 남아있으면 삭제가 막힌다. */
    void deleteByUserId(Long userId);
}
