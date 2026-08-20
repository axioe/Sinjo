import { request } from "./client";

/**
 * 관리자 전용 API (REQ-ADM-01)
 * 서버가 /api/admin/** 를 ADMIN 권한으로 막고 있어,
 * 일반 회원이 호출하면 403 이 돌아온다.
 */

export const getSummary = () => request("/api/admin/summary");

export const getWords = () => request("/api/admin/words");

export const createWord = (payload) =>
  request("/api/admin/words", { method: "POST", body: JSON.stringify(payload) });

export const updateWord = (id, payload) =>
  request(`/api/admin/words/${id}`, { method: "PUT", body: JSON.stringify(payload) });

export const deleteWord = (id) =>
  request(`/api/admin/words/${id}`, { method: "DELETE" });

export const getUsers = () => request("/api/admin/users");
