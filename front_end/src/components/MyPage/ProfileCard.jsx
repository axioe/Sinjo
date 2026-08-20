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
 * [수정] 만들어 둔 formatDate / formatDateTime 을 실제로 쓰지 않고 있었다.
 *
 * 서버가 주는 필드는 createdAt / lastLoginAt (ISO 문자열)인데
 * 화면은 profile.joinedAt / profile.lastLoginAt 을 그대로 출력했다. 그래서
 *  - 가입일     : profile.joinedAt 이 없어서 빈칸
 *  - 마지막 접속 : "2026-08-11T07:24:29.123456" 같은 원본 문자열이 그대로 노출
 * 되고 있었다. (formatDateTime 은 쓰이지 않아 npm run lint 도 실패했다)
 *
 * profile 이 아직 없을 수도 있으니 안전하게 접근한다.
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
