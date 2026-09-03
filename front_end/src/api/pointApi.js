import { request } from "./client";

/** 포인트 적립/상점 (REQ-MY-01). */

/**
 * 마이페이지 "포인트 보유량" 카드용.
 * MyPage.jsx 가 Promise.all 로 다른 데이터와 함께 불러온다 - 여기서 실패를
 * 조용히 삼키지 않으면(getMyQuizStats/getMyAttendance 와 같은 패턴) 포인트 조회
 * 하나 실패했다고 번역/즐겨찾기/게임 데이터까지 다 같이 못 불러오게 된다.
 */
export async function getMyPoints() {
  try {
    return await request("/api/points/me");
  } catch (error) {
    console.warn("[pointApi] 포인트 조회 실패", error);
    return null;
  }
}

/** 포인트 상점 목록 + 이미 구매한 항목. */
export const getShopItems = () => request("/api/points/shop");

/** 상점 구매. 이미 구매했거나 포인트가 부족하면 서버가 400 을 던진다(err.message 참고). */
export const purchaseItem = (itemId) =>
  request("/api/points/purchase", {
    method: "POST",
    body: JSON.stringify({ itemId }),
  });
