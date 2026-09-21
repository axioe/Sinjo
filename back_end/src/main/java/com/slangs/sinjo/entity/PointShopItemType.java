package com.slangs.sinjo.entity;

/**
 * 포인트 상점 항목의 효과 종류 (REQ-ADM-01, REQ-TR).
 */
public enum PointShopItemType {
    /** 장식용. 구매하면 그걸로 끝 - 실제 기능에 영향을 주지 않는다(프로필 테마, 뱃지 등). */
    COSMETIC,

    /**
     * 구매하는 즉시 그날 번역(신조어 검색) 가능 횟수를 effectValue 만큼 늘려준다.
     * 소모성이라 하루에 여러 번 다시 살 수 있고, "이미 구매함" 상태로 잠기지 않는다.
     */
    TRANSLATION_EXTRA
}
