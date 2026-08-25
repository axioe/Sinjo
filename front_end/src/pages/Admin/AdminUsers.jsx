import { useState, useEffect } from "react";
import { useAuth } from "../../AuthContext";
import { getUsers, updateUserRole, updateUser, deleteUser } from "../../api/adminApi";

/** 서버가 주는 ISO 문자열을 "2026.03.15" 형태로 바꾼다. */
function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

/**
 * 회원 관리 (REQ-ADM-01)
 * 권한 부여/해제, 닉네임 수정, 삭제가 즉시 DB 에 반영된다.
 * 본인 계정은 서버(AdminService)가 권한 변경·삭제를 막으므로 버튼 대신
 * "본인 계정" 표시만 보여준다.
 */
function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [nicknameInput, setNicknameInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    getUsers()
      .then(setUsers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const startEdit = (user) => {
    setEditingId(user.id);
    setNicknameInput(user.nickname);
    setActionError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNicknameInput("");
  };

  const handleSaveNickname = async (id) => {
    if (!nicknameInput.trim()) {
      setActionError("닉네임을 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const updated = await updateUser(id, { nickname: nicknameInput.trim() });
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      cancelEdit();
      setActionError("");
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleRole = async (user) => {
    const nextRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    const label = nextRole === "ADMIN" ? "관리자로 지정" : "일반 회원으로 변경";

    if (!window.confirm(`'${user.nickname}' 님을 ${label}할까요?`)) return;

    try {
      const updated = await updateUserRole(user.id, nextRole);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      setActionError("");
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`'${user.nickname}' 님을 삭제할까요? 이 작업은 되돌릴 수 없습니다.`)) return;

    try {
      await deleteUser(user.id);
      if (editingId === user.id) cancelEdit();
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setActionError("");
    } catch (err) {
      setActionError(err.message);
    }
  };

  if (loading) return <p className="admin-loading">불러오는 중...</p>;
  if (error) return <p className="admin-error">{error}</p>;

  return (
    <>
      <h1 className="admin-title">회원 관리</h1>
      <p className="admin-desc">전체 {users.length}명</p>

      {actionError && <p className="admin-alert">{actionError}</p>}

      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>이메일</th>
            <th>닉네임</th>
            <th>권한</th>
            <th>가입일</th>
            <th>마지막 접속</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isSelf = me?.id === user.id;
            const isEditing = editingId === user.id;

            return (
              <tr key={user.id} className={isEditing ? "editing" : ""}>
                <td>{user.id}</td>
                <td>{user.email}</td>
                <td>
                  {isEditing ? (
                    <input
                      value={nicknameInput}
                      onChange={(e) => setNicknameInput(e.target.value)}
                      autoFocus
                    />
                  ) : (
                    user.nickname
                  )}
                </td>
                <td>
                  <span className={`admin-badge ${user.role === "ADMIN" ? "admin" : ""}`}>
                    {user.role === "ADMIN" ? "관리자" : "일반"}
                  </span>
                </td>
                <td>{formatDate(user.createdAt)}</td>
                <td>{formatDate(user.lastLoginAt)}</td>
                <td className="admin-td-actions">
                  {isSelf ? (
                    <span className="admin-desc">본인 계정</span>
                  ) : isEditing ? (
                    <>
                      <button
                        type="button"
                        className="admin-btn small primary"
                        onClick={() => handleSaveNickname(user.id)}
                        disabled={submitting}
                      >
                        저장
                      </button>
                      <button type="button" className="admin-btn small" onClick={cancelEdit}>
                        취소
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="admin-btn small"
                        onClick={() => startEdit(user)}
                      >
                        닉네임 수정
                      </button>
                      <button
                        type="button"
                        className="admin-btn small"
                        onClick={() => handleToggleRole(user)}
                      >
                        {user.role === "ADMIN" ? "일반으로 변경" : "관리자 지정"}
                      </button>
                      <button
                        type="button"
                        className="admin-btn small danger"
                        onClick={() => handleDelete(user)}
                      >
                        삭제
                      </button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}

export default AdminUsers;
