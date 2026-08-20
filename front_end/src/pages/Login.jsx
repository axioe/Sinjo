import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { login as loginApi } from "../api/userApi";
import "../css/Login.css";
import SocialLogin from "../components/SocialLogin";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const found = {};

    if (!email.trim()) {
      found.email = "이메일을 입력해 주세요.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      found.email = "이메일 형식이 올바르지 않습니다.";
    }

    if (!password) {
      found.password = "비밀번호를 입력해 주세요.";
    }

    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);

    try {
      // 서버가 { token, user } 를 돌려준다.
      const data = await loginApi({ email, password });
      login(data.token, data.user);
      navigate("/");
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit} noValidate>
        <h2>로그인</h2>

        {errors.form && <p className="login-error">{errors.form}</p>}

        <div className="login-field">
          <label htmlFor="email">이메일</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((prev) => ({ ...prev, email: undefined, form: undefined }));
            }}
            placeholder="sinjo@example.com"
            autoComplete="email"
          />
          {errors.email && <p className="login-error">{errors.email}</p>}
        </div>

        <div className="login-field">
          <label htmlFor="password">비밀번호</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((prev) => ({ ...prev, password: undefined, form: undefined }));
            }}
            autoComplete="current-password"
          />
          {errors.password && <p className="login-error">{errors.password}</p>}
        </div>

        <button type="submit" className="login-submit" disabled={submitting}>
          {submitting ? "로그인 중..." : "로그인"}
        </button>

        <SocialLogin mode="login" />

        <p className="login-footer">
           <Link to="/find-password">비밀번호를 잊으셨나요?</Link>
           </p>

           <p className="login-footer">
          아직 계정이 없으신가요? <Link to="/signup">회원가입</Link>
        </p>
      </form>
    </div>
  );
}

export default Login;