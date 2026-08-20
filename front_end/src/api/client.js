/**
 * [수정] 서버 주소를 환경변수에서 읽는다.
 *
 * 기존에는 "http://localhost:8080" 이
 * client.js / quizApi.js / wordApi.js / translateApi.js /
 * Dictionary.jsx / Ranking.jsx / TodayWord.jsx 일곱 군데에 흩어져 있었다.
 * EC2 에 올릴 때 하나만 놓쳐도 그 화면만 조용히 CORS 오류가 난다.
 * .env 의 VITE_API_BASE_URL 한 곳에서만 관리한다.
 */
export const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

/** 서버 주소를 붙여 완성된 URL 을 만든다. fetch 를 직접 쓰는 화면에서 사용한다. */
export const apiUrl = (path) => `${BASE_URL}${path}`;

const TOKEN_KEY = "token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

/**
 * 서버 요청 공통 처리.
 *
 * 토큰이 있으면 Authorization 헤더에 자동으로 실어 보낸다.
 * 이 헤더가 없으면 서버는 요청자가 누군지 알 수 없어 401 을 돌려준다.
 */
export async function request(path, options = {}) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(apiUrl(path), { ...options, headers });

  if (!res.ok) {
    // 서버가 내려준 메시지를 그대로 전달한다.
    const data = await res.json().catch(() => null);
    const error = new Error(data?.message ?? `요청에 실패했습니다. (${res.status})`);
    error.status = res.status;
    error.fieldErrors = data?.fieldErrors ?? {};
    throw error;
  }

  // 204 No Content 처럼 본문이 없는 응답도 있다.
  if (res.status === 204) return null;
  return res.json();
}
