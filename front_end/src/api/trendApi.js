import { fastApiUrl } from "./client";

/**
 * Google Trends 인기 검색어 
 */
export async function getGoogleTrendRanking() {
   try {
    const res = await fetch(
      fastApiUrl("/fastapi/google-trends/ranking")
    );

    if (!res.ok) {
      throw new Error(`Google Trends 조회 실패 (${res.status})`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Google Trends 조회 실패:", error);
  }
}