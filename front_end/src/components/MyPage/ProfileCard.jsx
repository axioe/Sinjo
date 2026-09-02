import { FaCamera } from "react-icons/fa";

/** 서버가 주는 ISO 문자열을 "2026.03.15" 형태로 바꾼다. */
function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

/** 마지막 접속은 시각까지 보여준다. */
function formatDateTime(value) {
  if (!value) return "첫 방문이에요";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "첫 방문이에요";
  const pad = (n) => String(n).padStart(2, "0");
  return `${formatDate(value)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * 마이페이지 홈 상단 프로필 카드.
 * 닉네임·비밀번호 변경은 '유저 정보 변경' 메뉴(ProfileEdit)로 옮겼다.
 */
function ProfileCard({ profile }) {
  const nickname = profile?.nickname?.trim() || "회원";

  return (
    <section className="mypage-profile">
      <div className="mypage-avatar-wrap">
        <div className="mypage-avatar" aria-hidden="true">🙂</div>
        <button type="button" className="mypage-avatar-edit" aria-label="프로필 사진 변경">
          <FaCamera />
        </button>
      </div>

      <div className="mypage-profile-text">
        <h1 className="mypage-greeting">
          {nickname} 님, 안녕하세요! <span aria-hidden="true">👋</span>
        </h1>

        <p className="mypage-greeting-sub">오늘도 새로운 표현을 함께 배워봐요!</p>

        <div className="mypage-meta">
          <span className="mypage-meta-item">
            가입일 <strong>{formatDate(profile?.createdAt)}</strong>
          </span>
          <span className="mypage-meta-item">
            마지막 접속 <strong>{formatDateTime(profile?.lastLoginAt)}</strong>
          </span>
        </div>
      </div>
    </section>
  );
}

export default ProfileCard;