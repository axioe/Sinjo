import { request } from "./client";

/** 번역 이력 저장 */
export const saveTranslation = (payload) =>
  request("/api/mypage/history", {
    method: "POST",
    body: JSON.stringify(payload),
  });

/** 번역 */
export const translate = (keyword) =>
  request(`/api/words/search?question=${encodeURIComponent(keyword)}`, {
    method: "GET",
  });

/**
 * 마이페이지 - 번역 기록 조회
 */
export const getMyTranslations = async (page = 0, size = 5) => {
  const list = await request(`/api/mypage/history?page=${page}&size=${size}`, {
    method: "GET",
  });

  return list.map((t) => ({
    id: t.id,
    source: t.originalText,
    result: t.translatedText,

    createdAt: t.createdAt
      ? t.createdAt.slice(0, 16).replace("T", " ").replaceAll("-", ".")
      : "",

    // 서버가 favorite / isFavorite 중 하나를 내려주는 경우 대응
    favorite: Boolean(t.favorite ?? t.isFavorite ?? false),

    // 나중에 즐겨찾기 API에서 필요할 수 있으므로 wordId도 보관
    wordId: t.wordId ?? null,
  }));
};

/** 저장한 번역 개수 */
export const getMyTranslationCount = () =>
  request("/api/mypage/history/count", {
    method: "GET",
  });

export default {
  translate,
  getMyTranslations,
  getMyTranslationCount,
  saveTranslation,
};
