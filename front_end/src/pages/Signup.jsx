import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "../api/userApi";
import "../css/signup.css";

function Signup() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    nickname: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const setField = (name) => (e) => {
    setForm((prev) => ({ ...prev, [name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [name]: undefined, form: undefined }));
  };

  const validate = () => {
    const found = {};

    if (!form.email.trim()) {
      found.email = "이메일을 입력해 주세요.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      found.email = "이메일 형식이 올바르지 않습니다.";
    }

    if (!form.password) {
      found.password = "비밀번호를 입력해 주세요.";
    } else if (form.password.length < 8) {
      found.password = "비밀번호는 8자 이상이어야 합니다.";
    }

    if (form.password !== form.passwordConfirm) {
      found.passwordConfirm = "비밀번호가 일치하지 않습니다.";
    }

    const nickname = form.nickname.trim();
    if (!nickname) {
      found.nickname = "닉네임을 입력해 주세요.";
    } else if (nickname.length < 2 || nickname.length > 30) {
      found.nickname = "닉네임은 2자 이상 30자 이하여야 합니다.";
    }

    return found;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);

    try {
      await signup({
        email: form.email,
        password: form.password,
        nickname: form.nickname,
      });
      alert("회원가입이 완료되었습니다. 로그인해 주세요.");
      navigate("/login");
    } catch (err) {
      // 서버가 필드별 메시지를 주면 각 입력창 아래에 붙인다.
      setErrors({ ...err.fieldErrors, form: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="signup-container">
      <form className="signup-form" onSubmit={handleSubmit} noValidate>
        <h2>회원가입</h2>

        {errors.form && <p className="signup-alert">{errors.form}</p>}

        <input
          type="email"
          placeholder="example@email.com"
          value={form.email}
          onChange={setField("email")}
          autoComplete="email"
        />
        {errors.email && <p className="signup-error">{errors.email}</p>}

        <input
          type="text"
          placeholder="닉네임 (2~30자)"
          value={form.nickname}
          onChange={setField("nickname")}
          autoComplete="nickname"
        />
        {errors.nickname && <p className="signup-error">{errors.nickname}</p>}

        <input
          type="password"
          placeholder="8자 이상 비밀번호"
          value={form.password}
          onChange={setField("password")}
          autoComplete="new-password"
        />
        {errors.password && <p className="signup-error">{errors.password}</p>}

        <input
          type="password"
          placeholder="비밀번호 확인"
          value={form.passwordConfirm}
          onChange={setField("passwordConfirm")}
          autoComplete="new-password"
        />
        {errors.passwordConfirm && (
          <p className="signup-error">{errors.passwordConfirm}</p>
        )}

        <button type="submit" disabled={submitting}>
          {submitting ? "가입 중..." : "가입하기"}
        </button>

        <p className="signup-footer">
          이미 계정이 있으신가요? <Link to="/login">로그인</Link>
        </p>
      </form>
    </div>
  );
}

export default Signup;