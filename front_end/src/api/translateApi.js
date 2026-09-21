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

/**
 * 오늘의 번역 사용량(REQ-TR 하루 한도) - 마이페이지 카드용.
 * MyPage.jsx 가 Promise.all 로 다른 데이터와 함께 불러온다 - 여기서 실패를 조용히
 * 삼키지 않으면(getMyPoints 와 같은 패턴) 이 카드 하나 실패했다고 번역/즐겨찾기/게임
 * 데이터까지 다 같이 못 불러오게 된다.
 */
export async function getTranslationUsage() {
  try {
    return await request("/api/mypage/translation-usage");
  } catch (error) {
    console.warn("[translateApi] 오늘의 번역 사용량 조회 실패", error);
    return null;
  }
}

export default {
  translate,
  getMyTranslations,
  getMyTranslationCount,
  getTranslationUsage,
  saveTranslation,
};
