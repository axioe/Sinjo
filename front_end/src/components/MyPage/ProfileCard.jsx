import { useState } from "react";
import { FaCamera, FaPen } from "react-icons/fa";
import { useAuth } from "../../AuthContext";
import { updateNickname } from "../../api/userApi";

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

function ProfileCard({ profile }) {
  const { updateUser } = useAuth();
  const nickname = profile?.nickname?.trim() || "회원";

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(nickname);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setDraft(profile?.nickname ?? "");
    setError("");
    setEditing(true);
  };

  const cancelEdit = () => {
    setError("");
    setEditing(false);
  };

  const handleSave = async () => {
    const trimmed = draft.trim();

    if (trimmed.length < 2 || trimmed.length > 20) {
      setError("닉네임은 2~20자여야 합니다.");
      return;
    }

    if (trimmed === profile?.nickname) {
      setEditing(false);
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updated = await updateNickname(trimmed);
      updateUser(updated);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mypage-profile">
      <div className="mypage-avatar-wrap">
        <div className="mypage-avatar" aria-hidden="true">🙂</div>
        <button type="button" className="mypage-avatar-edit" aria-label="프로필 사진 변경">
          <FaCamera />
        </button>
      </div>

      <div className="mypage-profile-text">
        {editing ? (
          <div className="mypage-nickname-edit">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={20}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") cancelEdit();
              }}
            />
            <button type="button" onClick={handleSave} disabled={saving}>
              {saving ? "저장 중..." : "저장"}
            </button>
            <button type="button" onClick={cancelEdit} disabled={saving}>
              취소
            </button>
          </div>
        ) : (
          <h1 className="mypage-greeting">
            {nickname} 님, 안녕하세요! <span aria-hidden="true">👋</span>
            <button
              type="button"
              className="mypage-nickname-edit-btn"
              onClick={startEdit}
              aria-label="닉네임 변경"
            >
              <FaPen />
            </button>
          </h1>
        )}

        {error && <p className="mypage-nickname-error">{error}</p>}

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