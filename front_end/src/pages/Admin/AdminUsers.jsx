import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../AuthContext";
import { getUsers, updateUserRole, deleteUser } from "../../api/adminApi";

/** 서버가 주는 ISO 문자열을 "2026.03.15" 형태로 바꾼다. */
function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

const ROLE_FILTERS = [
  { key: "ALL", label: "전체" },
  { key: "ADMIN", label: "관리자" },
  { key: "USER", label: "일반" },
];

/**
 * 회원 관리 (REQ-ADM-01)
 * 권한 부여/해제, 삭제가 즉시 DB 에 반영된다.
 * 닉네임은 개인정보라 관리자가 아닌 회원 본인만 마이페이지에서 변경한다.
 * 본인 계정은 서버(AdminService)가 권한 변경·삭제를 막으므로 버튼 대신
 * "본인 계정" 표시만 보여준다.
 */
function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [loading, setLoading] = useState(true);

  const [roleFilter, setRoleFilter] = useState("ALL");
  const [keyword, setKeyword] = useState("");

  const load = () => {
    getUsers()
      .then(setUsers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // 전체 목록을 한 번에 받아오므로 걸러내는 일은 화면에서 처리한다.
  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    return users.filter((user) => {
      if (roleFilter !== "ALL" && user.role !== roleFilter) return false;
      if (!q) return true;

      return (
        user.email?.toLowerCase().includes(q) ||
        user.nickname?.toLowerCase().includes(q)
      );
    });
  }, [users, roleFilter, keyword]);

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
    if (
      !window.confirm(
        `'${user.nickname}' 님을 삭제할까요? 이 작업은 되돌릴 수 없습니다.`,
      )
    )
      return;

    try {
      await deleteUser(user.id);
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

      <div className="admin-filter-bar">
        <div className="admin-filter-tabs">
          {ROLE_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`admin-filter-tab ${roleFilter === key ? "active" : ""}`}
              onClick={() => setRoleFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <input
          type="search"
          className="admin-filter-search"
          placeholder="이메일 또는 닉네임 검색"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      <p className="admin-desc">
        {filtered.length}명
        {filtered.length !== users.length && ` / 전체 ${users.length}명`}
      </p>

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
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={7} className="admin-empty">
                조건에 맞는 회원이 없습니다.
              </td>
            </tr>
          ) : (
            filtered.map((user) => {
              const isSelf = me?.id === user.id;

              return (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.email}</td>
                  <td>{user.nickname}</td>
                  <td>
                    <span
                      className={`admin-badge ${user.role === "ADMIN" ? "admin" : ""}`}
                    >
                      {user.role === "ADMIN" ? "관리자" : "일반"}
                    </span>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td>{formatDate(user.lastLoginAt)}</td>
                  <td className="admin-td-actions">
                    {isSelf ? (
                      <span className="admin-self-label">현재 로그인한 계정</span>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="admin-btn small"
                          onClick={() => handleToggleRole(user)}
                        >
                          {user.role === "ADMIN"
                            ? "일반으로 변경"
                            : "관리자 지정"}
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
            })
          )}
        </tbody>
      </table>
    </>
  );
}

export default AdminUsers;
