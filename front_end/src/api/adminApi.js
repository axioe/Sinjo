import { request, apiUrl, getToken } from "./client";

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

export const updateUserRole = (id, role) =>
  request(`/api/admin/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) });

export const updateUser = (id, payload) =>
  request(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(payload) });

export const deleteUser = (id) =>
  request(`/api/admin/users/${id}`, { method: "DELETE" });

export const getQuizWords = () => request("/api/admin/quizzes");

export const createQuizWord = (payload) =>
  request("/api/admin/quizzes", { method: "POST", body: JSON.stringify(payload) });

export const updateQuizWord = (id, payload) =>
  request(`/api/admin/quizzes/${id}`, { method: "PUT", body: JSON.stringify(payload) });

export const deleteQuizWord = (id) =>
  request(`/api/admin/quizzes/${id}`, { method: "DELETE" });

export async function uploadWordsExcel(formData) {
  const token = getToken();

  const res = await fetch(apiUrl("/api/admin/words/excel"), {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message ?? `업로드에 실패했습니다. (${res.status})`);
  }

  return res.json();
}
export const getPointShopItems = () => request("/api/admin/point-shop-items");

export const createPointShopItem = (payload) =>
  request("/api/admin/point-shop-items", { method: "POST", body: JSON.stringify(payload) });

export const updatePointShopItem = (id, payload) =>
  request(`/api/admin/point-shop-items/${id}`, { method: "PUT", body: JSON.stringify(payload) });

export const deletePointShopItem = (id) =>
  request(`/api/admin/point-shop-items/${id}`, { method: "DELETE" });
