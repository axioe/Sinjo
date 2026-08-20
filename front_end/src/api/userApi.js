import { request } from "./client";

export const signup = (payload) =>
  request("/api/users/signup", { method: "POST", body: JSON.stringify(payload) });

export const login = (payload) =>
  request("/api/users/login", { method: "POST", body: JSON.stringify(payload) });

/** 토큰으로 내 정보를 조회한다. 마이페이지가 이걸 쓴다. */
export const getMyInfo = () => request("/api/users/me");