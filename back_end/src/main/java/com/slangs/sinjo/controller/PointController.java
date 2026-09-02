package com.slangs.sinjo.controller;

import com.slangs.sinjo.dto.PointDto;
import com.slangs.sinjo.service.PointService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** 포인트 적립/상점 API (REQ-MY-01). */
@RestController
@RequestMapping("/api/points")
@RequiredArgsConstructor
public class PointController {

    private final PointService pointService;

    @GetMapping("/me")
    public ResponseEntity<PointDto.Balance> getMyBalance(@AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(pointService.getBalance(userId));
    }

    @GetMapping("/shop")
    public ResponseEntity<PointDto.ShopResponse> getShopItems(@AuthenticationPrincipal Long userId) {
        return ResponseEntity.ok(pointService.getShopItems(userId));
    }

    @PostMapping("/purchase")
    public ResponseEntity<PointDto.PurchaseResponse> purchase(
            @AuthenticationPrincipal Long userId,
            @Valid @RequestBody PointDto.PurchaseRequest request) {
        return ResponseEntity.ok(pointService.purchase(userId, request.itemId()));
    }
}
