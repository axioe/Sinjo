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

    /** 이미 구매한 상점 아이템 id 목록 - 중복 구매를 막는 데 쓴다. */
    @Query("SELECT p.itemId FROM PointTransaction p WHERE p.user.id = :userId AND p.itemId IS NOT NULL")
    List<Long> findPurchasedItemIdsByUserId(@Param("userId") Long userId);

    /** 관리자가 회원을 삭제할 때 먼저 지운다 - user_id 가 FK(nullable = false)라 남아있으면 삭제가 막힌다. */
    void deleteByUserId(Long userId);
}
