package com.slangs.sinjo.entity;

public enum ProposalStatus {

    DISCUSSION,      // 사용자 토의 중
    REVIEW_REQUESTED,// 관리자 검수 요청
    AI_REVIEWED,     // AI 검수 완료
    APPROVED,        // 관리자 승인
    REJECTED         // 관리자 반려
}