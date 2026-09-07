import { request } from "./client";

/**
 * 신조어 제안 목록
 */
export async function getProposals() {
  return request("/api/proposals");
}

/**
 * 신조어 제안 상세
 */
export async function getProposal(id) {
  return request(`/api/proposals/${id}`);
}

/**
 * 신조어 제안 등록
 */
export async function createProposal(data) {
  return request("/api/proposals", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * 신조어 제안 수정
 */
export async function updateProposal(id, data) {
  return request(`/api/proposals/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * 신조어 제안 삭제
 */
export async function deleteProposal(id) {
  return request(`/api/proposals/${id}`, {
    method: "DELETE",
  });
}

/**
 * 댓글 목록
 */
export async function getProposalComments(proposalId) {
  return request(`/api/proposals/${proposalId}/comments`);
}

/**
 * 댓글 작성
 */
export async function createComment(proposalId, data) {
  return request(`/api/proposals/${proposalId}/comments`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * 댓글 수정
 */
export async function updateComment(commentId, data) {
  return request(`/api/proposals/comments/${commentId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * 댓글 삭제
 */
export async function deleteComment(commentId) {
  return request(`/api/proposals/comments/${commentId}`, {
    method: "DELETE",
  });
}

/** 
 * 신조어 제안 투표
 * type: 
 * - LIKE 
 * - DISLIKE 
 * POST /api/proposals/{proposalId}/vote?type=LIKE
 */ 
export const voteProposal = async (proposalId, type) => {
  return request(`/api/proposals/${proposalId}/vote`, {
    method: "POST",
    body: JSON.stringify({
      type,
    }),
  });
}