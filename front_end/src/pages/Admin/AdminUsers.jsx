import { useState, useEffect } from "react";
import { getUsers } from "../../api/adminApi";

/** 서버가 주는 ISO 문자열을 "2026.03.15" 형태로 바꾼다. */
function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="admin-loading">불러오는 중...</p>;
  if (error) return <p className="admin-error">{error}</p>;

  return (
    <>
      <h1 className="admin-title">회원 관리</h1>
      <p className="admin-desc">전체 {users.length}명</p>

      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>이메일</th>
            <th>닉네임</th>
            <th>권한</th>
            <th>가입일</th>
            <th>마지막 접속</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.email}</td>
              <td>{user.nickname}</td>
              <td>
                <span className={`admin-badge ${user.role === "ADMIN" ? "admin" : ""}`}>
                  {user.role === "ADMIN" ? "관리자" : "일반"}
                </span>
              </td>
              <td>{formatDate(user.createdAt)}</td>
              <td>{formatDate(user.lastLoginAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export default AdminUsers;
