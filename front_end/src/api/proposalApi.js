import { request } from "./client";

/**
 * 신조어 제안 목록
 *
 * @param {number} page 0부터 시작
 * @param {number} size 페이지당 개수
 * @param {string} keyword 검색어
 * @param {string} sortType 정렬 방식
 */
export async function getProposals(
  page = 0,
  size = 10,
  keyword = "",
  sortType = "LATEST"
) {
  const params = new URLSearchParams();

  params.set("page", page);
  params.set("size", size);
  params.set("sortType", sortType);

  if (keyword.trim()) {
    params.set("keyword", keyword.trim());
  }

  return request(`/api/proposals?${params.toString()}`);
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

/**
 * 신조어 검색 자동완성
 */
export async function getProposalSuggestions(keyword) {
  if (!keyword?.trim()) {
    return [];
  }

  return request(
    `/api/proposals/suggestions?keyword=${encodeURIComponent(
      keyword.trim(),
    )}`,
  );
}