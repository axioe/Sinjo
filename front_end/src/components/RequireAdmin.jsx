import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";

/**
 * 관리자만 볼 수 있는 페이지를 감싼다.
 *
 * 화면을 막는 것과 서버가 막는 것은 별개다.
 * 여기서 막는 건 "잘못 들어온 사용자에게 빈 화면을 보여주지 않기" 위해서고,
 * 실제 보호는 서버의 SecurityConfig 가 한다.
 * 이 파일만 있고 서버가 안 막으면 주소를 직접 호출해 데이터를 가져갈 수 있다.
 */
function RequireAdmin({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p style={{ padding: "60px", textAlign: "center" }}>불러오는 중...</p>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user.role !== "ADMIN") {
    // 일반 회원이 주소를 직접 입력한 경우. 마이페이지로 돌려보낸다.
    return <Navigate to="/mypage" replace />;
  }

  return children;
}

export default RequireAdmin;
