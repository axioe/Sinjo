import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";

/**
 * 로그인해야 볼 수 있는 페이지를 감싼다.
 *
 * loading 을 기다리는 게 중요하다.
 * 새로고침 직후에는 토큰으로 내 정보를 불러오는 중이라 user 가 잠깐 null 인데,
 * 이때 바로 내보내면 로그인 상태인데도 로그인 화면으로 튕긴다.
 */
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p style={{ padding: "60px", textAlign: "center" }}>불러오는 중...</p>;
  }

  if (!user) {
    // 로그인 후 원래 가려던 곳으로 돌아올 수 있도록 위치를 넘긴다.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default RequireAuth;