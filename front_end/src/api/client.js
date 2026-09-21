export const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export const FASTAPI_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export const apiUrl = (path) => `${BASE_URL}${path}`;

export const fastApiUrl = (path) => `${FASTAPI_BASE_URL}${path}`;

const TOKEN_KEY = "token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);

export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export async function request(path, options = {}) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(apiUrl(path), {
    ...options,
    headers,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);

    const error = new Error(
      data?.message ?? `요청에 실패했습니다. (${res.status})`,
    );

    error.status = res.status;

    error.fieldErrors = data?.fieldErrors ?? {};

    throw error;
  }

  if (res.status === 204) {
    return null;
  }

  const text = await res.text();

  return text ? JSON.parse(text) : null;
}
