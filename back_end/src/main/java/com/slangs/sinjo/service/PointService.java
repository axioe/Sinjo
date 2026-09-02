package com.slangs.sinjo.service;

import com.slangs.sinjo.dto.PointDto;
import com.slangs.sinjo.entity.PointShopItem;
import com.slangs.sinjo.entity.PointTransaction;
import com.slangs.sinjo.entity.User;
import com.slangs.sinjo.exception.NotFoundException;
import com.slangs.sinjo.exception.UnauthorizedException;
import com.slangs.sinjo.repository.PointShopItemRepository;
import com.slangs.sinjo.repository.PointTransactionRepository;
import com.slangs.sinjo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * 포인트 적립/상점 (REQ-MY-01).
 * <p>
 * 포인트 상점 화면은 팀원이 프론트만 먼저 만들어 둔 프로토타입이었다("구매 기능은
 * 현재 준비 중입니다" 알림만 뜨고 실제 처리는 없었음, PointShop.jsx 참고). 이 서비스가
 * 그 뒤를 채운다.
 * <p>
 * 적립은 "번역 저장"과 "게임 플레이" 두 곳에서만 일어난다 - 상점 화면 안내 문구
 * ("단어를 번역하거나 게임을 플레이하면서 활동 포인트를 모아보세요")와 맞춘 것이다.
 * MyPageService.saveHistory / QuizService.saveAttempt 에서 이 서비스를 호출한다.
 * <p>
 * [추가] 상점 카탈로그(PointShopItem)는 AdminService 가 관리한다 - 여기서는 조회/
 * 가격 검증만 한다. 가격을 프론트가 아니라 서버에서 최종 검증하는 이유는, 클라이언트가
 * 보낸 가격을 그대로 믿으면 조작된 가격으로 구매될 수 있어서다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PointService {

    private final PointTransactionRepository pointTransactionRepository;
    private final PointShopItemRepository pointShopItemRepository;
    private final UserRepository userRepository;

    /**
     * 포인트 적립. userId 가 null(비로그인)이거나 amount 가 0 이하면 조용히 무시한다 -
     * 비로그인 번역/퀴즈 플레이는 원래도 기록을 안 남기는 흐름이라 자연스럽게 맞는다.
     */
    @Transactional
    public void earn(Long userId, int amount, String reason) {
        if (userId == null || amount <= 0) {
            return;
        }

        User user = userRepository.getReferenceById(userId);
        pointTransactionRepository.save(new PointTransaction(user, amount, reason, null));
    }

    /** 마이페이지 "포인트 보유량" 카드용. */
    public PointDto.Balance getBalance(Long userId) {
        if (userId == null) {
            throw new UnauthorizedException();
        }

        return new PointDto.Balance(pointTransactionRepository.sumAmountByUserId(userId));
    }

    /** 포인트 상점 목록 + 이미 구매한 항목. */
    public PointDto.ShopResponse getShopItems(Long userId) {
        if (userId == null) {
            throw new UnauthorizedException();
        }

        List<PointDto.ShopItem> items = pointShopItemRepository.findAllByOrderByIdAsc().stream()
                .map(item -> new PointDto.ShopItem(item.getId(), item.getName(), item.getPrice()))
                .toList();

        return new PointDto.ShopResponse(items, pointTransactionRepository.findPurchasedItemIdsByUserId(userId));
    }

    /**
     * 상점 구매.
     * 이미 산 항목이거나 포인트가 부족하면 IllegalArgumentException(400) 으로 막는다.
     */
    @Transactional
    public PointDto.PurchaseResponse purchase(Long userId, Long itemId) {
        if (userId == null) {
            throw new UnauthorizedException();
        }

        PointShopItem item = pointShopItemRepository.findById(itemId)
                .orElseThrow(() -> new NotFoundException("존재하지 않는 상품입니다."));

        if (pointTransactionRepository.findPurchasedItemIdsByUserId(userId).contains(itemId)) {
            throw new IllegalArgumentException("이미 구매한 상품입니다.");
        }

        long balance = pointTransactionRepository.sumAmountByUserId(userId);
        if (balance < item.getPrice()) {
            throw new IllegalArgumentException("포인트가 부족합니다.");
        }

        User user = userRepository.getReferenceById(userId);
        pointTransactionRepository.save(
                new PointTransaction(user, -item.getPrice(), "포인트 상점 구매: " + item.getName(), item.getId())
        );

        return new PointDto.PurchaseResponse(balance - item.getPrice(), item.getName());
    }
}
