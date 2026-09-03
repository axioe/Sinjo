import { request } from "./client";

/**
 * 관리자 제안 목록
 */
export async function getAdminProposals() {
  return request("/api/admin/proposals");
}

/**
 * 관리자 제안 상세
 */
export async function getAdminProposal(proposalId) {
  return request(`/api/admin/proposals/${proposalId}`);
}

/**
 * 관리자 검수 요청
 */
export async function requestProposalReview(proposalId) {
  return request(
    `/api/admin/proposals/${proposalId}/review-request`,
    {
      method: "POST",
    }
  );
}

/**
 * AI 검수 실행
 */
export async function executeProposalAiReview(proposalId) {
  return request(
    `/api/admin/proposals/${proposalId}/ai-review`,
    {
      method: "POST",
    }
  );
}

/**
 * 제안 승인
 */
export async function approveProposal(proposalId, data) {
  return request(
    `/api/admin/proposals/${proposalId}/approve`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

/**
 * 제안 반려
 */
export async function rejectProposal(proposalId) {
  return request(
    `/api/admin/proposals/${proposalId}/reject`,
    {
      method: "POST",
    }
  );
}