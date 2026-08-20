import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { setToken } from "../api/client";
import { getMyInfo } from "../api/userApi";

function OAuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = params.get("token");

    if (!token) {
      navigate("/login");
      return;
    }

    // getMyInfo 가 헤더에 토큰을 붙일 수 있도록 먼저 저장
    setToken(token);

    getMyInfo()
      .then((user) => {
        login(token, user);
        navigate("/");
      })
      .catch(() => navigate("/login"));
  }, []);

  return <p style={{ textAlign: "center", padding: "60px" }}>로그인 중...</p>;
}

export default OAuthCallback;