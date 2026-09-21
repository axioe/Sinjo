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
 */
export const getWord = (id) => request(`/api/words/${id}`);

/**
 * 좋아요
 */
export const likeWord = (id) =>
  request(`/api/words/${id}/like`, {
    method: "POST",
  });

/**
 * 좋아요 취소
 */
export const unlikeWord = (id) =>
  request(`/api/words/${id}/like`, {
    method: "DELETE",
  });

/**
 * 현재 로그인 사용자가 좋아요한 단어 ID 목록
 */
export const getLikedWordIds = () => request("/api/words/liked");
