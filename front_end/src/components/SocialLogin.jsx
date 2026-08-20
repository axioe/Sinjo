import "../css/SocialLogin.css"

function SocialLogin({mode = "login"}) {
  const text = mode === "login" ? "로그인" : "시작하기"

  const handleNaver = () => {
    window.location.href = "http://localhost:8080/api/auth/naver"
  }

  const handleGoogle = () => {
    alert("구글 로그인 준비 중 입니다.")
  }

  return (
    <div className="social-login">
      <div className="social-divider">
        <span>또는</span>
      </div>

      <button type="button" className="social-btn naver" onClick={handleNaver}>
      네이버로 {text}
      </button>

      <button type="button" className="social-btn google" onClick={handleGoogle}>
      구글로 {text}
      </button>
    </div>
  )
}

export default SocialLogin;