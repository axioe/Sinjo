import { useState } from "react";
import { changePassword } from "../../api/userApi";

function PasswordChangeModal({ onClose }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!current) {
      setError("현재 비밀번호를 입력해 주세요.");
      return;
    }
    if (next.length < 8) {
      setError("새 비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (next !== confirm) {
      setError("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await changePassword(current, next);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>

        <h2 className="modal-title">비밀번호 변경</h2>

        {done ? (
          <>
            <p className="modal-done">비밀번호가 변경되었습니다.</p>
            <button type="button" className="modal-submit" onClick={onClose}>
              확인
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-field">
              <label>현재 비밀번호</label>
              <input
                type="password"
                value={current}
                onChange={(e) => { setCurrent(e.target.value); setError(""); }}
                autoFocus
              />
            </div>

            <div className="modal-field">
              <label>새 비밀번호</label>
              <input
                type="password"
                value={next}
                onChange={(e) => { setNext(e.target.value); setError(""); }}
                placeholder="8자 이상"
              />
            </div>

            <div className="modal-field">
              <label>새 비밀번호 확인</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setError(""); }}
              />
            </div>

            {error && <p className="modal-error">{error}</p>}

            <div className="modal-actions">
              <button type="button" className="modal-cancel" onClick={onClose}>
                취소
              </button>
              <button type="submit" className="modal-submit" disabled={saving}>
                {saving ? "변경 중..." : "변경하기"}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}

export default PasswordChangeModal;