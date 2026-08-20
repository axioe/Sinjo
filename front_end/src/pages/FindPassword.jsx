import { useState } from "react";
import { Link } from "react-router-dom";
import "../css/Login.css";

function FindPassword() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    const found = {};

    if (!email.trim()) {
      found.email = "이메일을 입력해 주세요.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      found.email = "이메일 형식이 올바르지 않습니다.";
    }

    setErrors(found);

    if (Object.keys(found).length > 0) return;

    setSent(true);
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit} noValidate>
        <h2>비밀번호 찾기</h2>
        <p className="login-field">가입하신 이메일로 재설정 링크를 보내드립니다.</p>

        {sent ? (
          <p className="login-field">
            입력하신 이메일로 재설정 링크를 보냈습니다. 메일함을 확인해 주세요.
          </p>
        ) : (
          <>
            <div className="login-field">
              <label htmlFor="email">이메일</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder="가입하신 이메일을 입력하세요."
              />
              {errors.email && <p className="login-error">{errors.email}</p>}
            </div>

            <button type="submit" className="login-submit">
              재설정 링크 받기
            </button>
          </>
        )}

        <p className="login-footer">
          <Link to="/login">로그인으로 돌아가기</Link>
        </p>
      </form>
    </div>
  );
}

export default FindPassword;
