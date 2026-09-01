import { request } from "./client";

/** 즐겨찾기 단어 목록 (REQ-MY-01) */
export const getMyFavorites = async (page = 0, size = 5) => {
  const list = await request(
    `/api/mypage/favorites?page=${page}&size=${size}`,
    {
      method: "GET",
    },
  );

  return list.map((f) => ({
    id: f.id,
    wordId: f.wordId,
    word: f.word,
    meaning: f.meaning,
    category: f.category,
    createdAt: f.createdAt
      ? f.createdAt.slice(0, 16).replace("T", " ").replaceAll("-", ".")
      : "",
  }));
};

/** 즐겨찾기 개수 */
export const getMyFavoriteCount = () =>
  request("/api/mypage/favorites/count", { method: "GET" });

/** 즐겨찾기 등록 */
export const addFavorite = (wordId) =>
  request(`/api/mypage/favorites/${wordId}`, { method: "POST" });

/** 즐겨찾기 해제 */
export const removeFavorite = (wordId) =>
  request(`/api/mypage/favorites/${wordId}`, { method: "DELETE" });

export default {
  getMyFavorites,
  getMyFavoriteCount,
  addFavorite,
  removeFavorite,
};
