package com.slangs.sinjo.config;

import com.slangs.sinjo.entity.PointShopItem;
import com.slangs.sinjo.repository.PointShopItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 포인트 상점 초기 카탈로그 시드 (REQ-MY-01).
 * <p>
 * 원래 PointService 안 고정 Map(SHOP_ITEMS)이었던 4개 상품을 관리자가 화면에서
 * 관리할 수 있게 PointShopItem 테이블로 옮기면서, 기존 사용자가 상점을 열었을 때
 * 목록이 비어 보이지 않도록 최초 1회만 채워 넣는다. AdminAccountInitializer 와
 * 같은 방식으로 테이블이 비어 있을 때만 동작해 여러 번 켜도 안전하다 - 관리자가
 * 이후 화면에서 수정/삭제하면 그 상태가 유지된다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PointShopItemInitializer implements ApplicationRunner {

    private final PointShopItemRepository pointShopItemRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (pointShopItemRepository.count() > 0) {
            return;
        }

        pointShopItemRepository.saveAll(List.of(
                new PointShopItem("프로필 테마", 300),
                new PointShopItem("닉네임 뱃지", 500),
                new PointShopItem("반짝반짝 효과", 700),
                new PointShopItem("VIP 뱃지", 1000)
        ));

        log.info("포인트 상점 기본 카탈로그를 채웠습니다.");
    }
}
