package com.slangs.sinjo.config;

import com.slangs.sinjo.entity.PointShopItem;
import com.slangs.sinjo.entity.PointShopItemType;
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
 * 목록이 비어 보이지 않도록 채워 넣는다.
 * <p>
 * [수정] "테이블이 비어 있을 때만" 채우던 이전 방식은, 이미 한 번 시딩된 뒤 나중에
 * 기본 상품이 추가되면(예: 번역권 +5) 그 새 상품이 영원히 채워지지 않는 문제가 있었다
 * - 운영 DB가 상품 4개짜리 구버전으로 이미 한 번 부팅된 뒤로는 count() > 0 이 항상 참이라,
 * 번역권 기능을 배포해도 상점엔 안 나타났다. 이제는 이름 기준으로 "빠진 것만" 채워 넣어서,
 * 기본 카탈로그가 나중에 늘어나도 다음 부팅 때 자동으로 보완된다. 관리자가 화면에서
 * 이름을 바꾸거나 삭제한 상품은 그대로 존중한다(같은 이름이 없으면 다시 만들어지므로,
 * 완전히 새 이름으로 바꾸는 걸 권장한다).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PointShopItemInitializer implements ApplicationRunner {

    private final PointShopItemRepository pointShopItemRepository;

    private static final List<PointShopItem> DEFAULT_CATALOG = List.of(
            new PointShopItem(
                    "프로필 테마", 300, "마이페이지 프로필을 나만의 분위기로 꾸밀 수 있어요.", "🎨",
                    PointShopItemType.COSMETIC, null
            ),
            new PointShopItem(
                    "닉네임 뱃지", 500, "프로필에 특별한 닉네임 뱃지를 표시할 수 있어요.", "🏷️",
                    PointShopItemType.COSMETIC, null
            ),
            new PointShopItem(
                    "반짝반짝 효과", 700, "프로필에 특별한 반짝임 효과를 추가할 수 있어요.", "✨",
                    PointShopItemType.COSMETIC, null
            ),
            new PointShopItem(
                    "VIP 뱃지", 1000, "특별한 VIP 뱃지로 프로필을 꾸밀 수 있어요.", "👑",
                    PointShopItemType.COSMETIC, null
            ),
            new PointShopItem(
                    "번역권 +5", 200, "오늘 하루 번역 가능 횟수를 5건 늘려줘요. 여러 번 살 수 있어요.", "🎟️",
                    PointShopItemType.TRANSLATION_EXTRA, 5
            )
    );

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<PointShopItem> missing = DEFAULT_CATALOG.stream()
                .filter(item -> !pointShopItemRepository.existsByName(item.getName()))
                .toList();

        if (missing.isEmpty()) {
            return;
        }

        pointShopItemRepository.saveAll(missing);

        log.info("포인트 상점 기본 카탈로그 중 {}개 상품을 새로 채웠습니다.", missing.size());
    }
}
