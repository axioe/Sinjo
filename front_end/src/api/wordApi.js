import { request } from "./client";

/**
 * 좋아요 기준 인기 신조어 TOP 5
 */
export const getRankingWords = () => request("/api/words/ranking");

/**
 * 신조어 전체 목록
 */
export const getWords = () => request("/api/words");

/**
 * 신조어 한 건
 *
 * 상세 페이지 진입 시
 * 백엔드에서 조회수 +1
 */
export const getWord = (id) => request(`/api/words/${id}`);

/**
 * 좋아요
 */
export const likeWord = (id) =>
  request(`/api/words/${id}/like`, {
    method: "POST",
  });
