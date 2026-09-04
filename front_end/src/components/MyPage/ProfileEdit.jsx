import "../../css/mypage/ProfileEdit.css";
import { useState } from "react";
import { useAuth } from "../../AuthContext";
import { updateNickname, changePassword } from "../../api/userApi";

function ProfileEdit() {
  const { user, updateUser } = useAuth();

  // 닉네임
  const [draft, setDraft] = useState(user?.nickname ?? "");
  const [nickError, setNickError] = useState("");
  const [nickDone, setNickDone] = useState("");
  const [nickSaving, setNickSaving] = useState(false);

  // 비밀번호
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwDone, setPwDone] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  const handleNicknameSave = async () => {
    const trimmed = draft.trim();

    if (trimmed.length < 2 || trimmed.length > 20) {
      setNickError("닉네임은 2~20자여야 합니다.");
      return;
    }

    if (trimmed === user?.nickname) {
      setNickError("현재 닉네임과 동일합니다.");
      return;
    }

    setNickSaving(true);
    setNickError("");
    setNickDone("");

    try {
      const updated = await updateNickname(trimmed);
      updateUser(updated);
      setNickDone("닉네임이 변경되었습니다.");
    } catch (err) {
      setNickError(err.message);
    } finally {
      setNickSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!current) {
      setPwError("현재 비밀번호를 입력해 주세요.");
      return;
    }
    if (next.length < 8) {
      setPwError("새 비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (next !== confirm) {
      setPwError("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    setPwSaving(true);
    setPwError("");
    setPwDone("");

    try {
      await changePassword(current, next);
      setPwDone("비밀번호가 변경되었습니다.");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwSaving(false);
    }
  };

  const clearPwMessage = () => {
    setPwError("");
    setPwDone("");
  };

  return (
    <div className="mypage-card profile-edit">
      <div className="profile-edit-field">
        <label htmlFor="email">이메일</label>
        <input id="email" type="text" value={user?.email ?? ""} disabled />
        <p className="profile-edit-hint">이메일은 변경할 수 없습니다.</p>
      </div>

      <div className="profile-edit-field">
        <label htmlFor="nickname">닉네임</label>

        <div className="profile-edit-row">
          <input
            id="nickname"
            type="text"
            value={draft}
            maxLength={20}
            onChange={(e) => {
              setDraft(e.target.value);
              setNickError("");
              setNickDone("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleNicknameSave();
            }}
          />

          <button
            type="button"
            className="profile-edit-btn"
            onClick={handleNicknameSave}
            disabled={nickSaving}
          >
            {nickSaving ? "저장 중..." : "변경"}
          </button>
        </div>

        {nickError && <p className="profile-edit-error">{nickError}</p>}
        {nickDone && <p className="profile-edit-done">{nickDone}</p>}
      </div>

      <div className="profile-edit-divider" />

      <form onSubmit={handlePasswordSubmit}>
        <p className="profile-edit-section-title">비밀번호 변경</p>

        <div className="profile-edit-field">
          <label htmlFor="current-pw">현재 비밀번호</label>
          <input
            id="current-pw"
            type="password"
            autoComplete="current-password"
            value={current}
            onChange={(e) => {
              setCurrent(e.target.value);
              clearPwMessage();
            }}
          />
        </div>

        <div className="profile-edit-field">
          <label htmlFor="new-pw">새 비밀번호</label>
          <input
            id="new-pw"
            type="password"
            autoComplete="new-password"
            placeholder="8자 이상"
            value={next}
            onChange={(e) => {
              setNext(e.target.value);
              clearPwMessage();
            }}
          />
        </div>

        <div className="profile-edit-field">
          <label htmlFor="confirm-pw">새 비밀번호 확인</label>
          <input
            id="confirm-pw"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              clearPwMessage();
            }}
          />
        </div>

        {pwError && <p className="profile-edit-error">{pwError}</p>}
        {pwDone && <p className="profile-edit-done">{pwDone}</p>}

        <button
          type="submit"
          className="profile-edit-btn wide"
          disabled={pwSaving}
        >
          {pwSaving ? "변경 중..." : "비밀번호 변경"}
        </button>
      </form>
    </div>
  );
}

export default ProfileEdit;