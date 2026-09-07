package com.slangs.sinjo.entity;

public enum ProposalStatus {

    /**
     * 사용자들이 의견을 나누고 투표하는 단계
     */
    DISCUSSION,

    /**
     * Like 임계값 도달
     * 관리자 검수 대상
     */
    REVIEW_REQUESTED,

    /**
     * AI 검수 완료
     */
    AI_REVIEWED,

    /**
     * 관리자 승인 완료
     * 실제 Word 생성
     */
    APPROVED,

    /**
     * 관리자 반려
     */
    REJECTED
}