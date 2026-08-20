import { useState, useEffect, useCallback } from "react";
import { AuthContext } from "./AuthContext";
import { getToken, setToken, clearToken } from "./api/client";
import { getMyInfo } from "./api/userApi";

/**
 * 로그인 상태를 앱 전체가 공유한다.
 *
 * 이전에는 로그인 응답을 localStorage 에 그대로 저장했는데,
 * 그건 화면 표시용일 뿐 서버에 아무것도 증명하지 못한다.
 * 이제는 서버가 서명한 토큰을 저장하고, 회원 정보는 그 토큰으로 서버에서 받아온다.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // 토큰이 없으면 불러올 것도 없으니 처음부터 로딩이 끝난 상태로 시작한다.
  const [loading, setLoading] = useState(() => Boolean(getToken()));

  // 새로고침 시 토큰이 남아 있으면 내 정보를 다시 불러온다.
  useEffect(() => {
    if (!getToken()) return;

    let cancelled = false;

    getMyInfo()
      .then((data) => {
        if (!cancelled) setUser(data);
      })
      .catch(() => {
        // 토큰이 만료됐거나 위조된 경우
        clearToken();
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // 응답이 오기 전에 화면을 벗어나면 상태를 건드리지 않는다.
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback((token, userData) => {
    setToken(token);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}