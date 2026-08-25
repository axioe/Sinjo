import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import "../../css/auth/Login.css";

function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const found = {};

    if (!password) {
      found.password = "새 비밀번호를 입력해 주세요.";
    } else if (password.length < 8) {
      found.password = "비밀번호는 8자 이상이어야 합니다.";
    }

    if (password !== confirm) {
      found.confirm = "비밀번호가 일치하지 않습니다.";
    }

    setErrors(found);
    if (Object.keys(found).length > 0) return;

    try {
      const res = await fetch("http://localhost:8080/api/users/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password })
      });

      if (!res.ok) {
        setErrors({ form: "만료되었거나 이미 사용된 링크입니다." });
        return;
      }

      setDone(true);

    } catch (err) {
      console.error(err);
      setErrors({ form: "서버에 연결할 수 없습니다." });
    }
  };

  if (!token) {
    return (
      <div className="login-container">
        <div className="login-form">
          <h2>잘못된 접근</h2>
          <p className="login-error">유효하지 않은 링크입니다.</p>
          <p className="login-footer"><Link to="/forgot-password">다시 요청하기</Link></p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit} noValidate>
        <h2>비밀번호 재설정</h2>

        {done ? (
          <>
            <p className="login-field">비밀번호가 변경되었습니다.</p>
            <button type="button" className="login-submit" onClick={() => navigate("/login")}>
              로그인하러 가기
            </button>
          </>
        ) : (
          <>
            <div className="login-field">
              <label htmlFor="password">새 비밀번호</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                placeholder="8자 이상 입력하세요."
              />
              {errors.password && <p className="login-error">{errors.password}</p>}
            </div>

            <div className="login-field">
              <label htmlFor="confirm">새 비밀번호 확인</label>
              <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => {
                  setConfirm(e.target.value);
                  setErrors((prev) => ({ ...prev, confirm: undefined }));
                }}
              />
              {errors.confirm && <p className="login-error">{errors.confirm}</p>}
            </div>

            {errors.form && <p className="login-error">{errors.form}</p>}

            <button type="submit" className="login-submit">비밀번호 변경</button>
          </>
        )}
      </form>
    </div>
  );
}

export default ResetPassword;