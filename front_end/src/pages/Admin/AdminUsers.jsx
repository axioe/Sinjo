import { useState, useEffect, useMemo, useRef } from "react";
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

/** 열별 기본 폭(px). key 는 아래 th 와 td 에서 함께 쓴다. */
const DEFAULT_WIDTHS = {
  id: 60,
  email: 200,
  nickname: 140,
  role: 90,
  createdAt: 110,
  lastLoginAt: 110,
  actions: 200,
};

const PAGE_SIZE = 10;

/**
 * 회원 관리 (REQ-ADM-01)
 * 권한 부여/해제, 삭제가 즉시 DB 에 반영된다.
 * 닉네임은 개인정보라 관리자가 아닌 회원 본인만 마이페이지에서 변경한다.
 * 본인 계정은 서버(AdminService)가 권한 변경·삭제를 막으므로 버튼 대신
 * "현재 로그인한 계정" 표시만 보여준다.
 */
function AdminUsers() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);

  // 내용이 길면 잘리므로 머리글 경계를 끌어 열 폭을 조절할 수 있게 한다.
  const [widths, setWidths] = useState(DEFAULT_WIDTHS);
  const dragRef = useRef(null);

  const load = () => {
    getUsers()
      .then(setUsers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // 필터를 바꾸면 결과가 줄어 현재 페이지가 비어버릴 수 있으므로 1쪽으로 돌린다.
  useEffect(() => {
    setPage(1);
  }, [roleFilter, keyword]);

  /**
   * 드래그 중 커서가 표 밖으로 나갈 수 있으므로
   * 이벤트는 th 가 아니라 window 에 건다.
   */
  const startResize = (key) => (e) => {
    e.preventDefault();
    dragRef.current = { key, startX: e.clientX, startWidth: widths[key] };

    const handleMove = (ev) => {
      const drag = dragRef.current;
      if (!drag) return;

      const delta = ev.clientX - drag.startX;
      setWidths((prev) => ({
        ...prev,
        // 너무 좁아지면 내용이 안 보이므로 하한을 둔다.
        [drag.key]: Math.max(60, drag.startWidth + delta),
      }));
    };

    const handleUp = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  };

  // 전체 목록을 한 번에 받아오므로 걸러내는 일은 화면에서 처리한다.
  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    return users
      .filter((user) => {
        if (roleFilter !== "ALL" && user.role !== roleFilter) return false;
        if (!q) return true;

        return (
          user.email?.toLowerCase().includes(q) ||
          user.nickname?.toLowerCase().includes(q)
        );
      })
      // sort 는 원본 배열을 바꾸므로 filter 가 만든 새 배열에만 건다.
      // users 에 직접 걸면 state 를 직접 수정하는 셈이 된다.
      .sort((a, b) => b.id - a.id);
  }, [users, roleFilter, keyword]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  // 삭제로 목록이 줄어 마지막 페이지가 사라지면 범위 안으로 당긴다.
  const safePage = Math.min(page, totalPages);

  const pageRows = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage],
  );

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

  /** 폭 조절 손잡이가 달린 머리글 */
  const ResizableTh = ({ colKey, children }) => (
    <th className="admin-th-resizable" style={{ width: widths[colKey] }}>
      {children}
      <span
        className="admin-col-resizer"
        onMouseDown={startResize(colKey)}
        title="끌어서 폭 조절"
      />
    </th>
  );

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

      <div className="admin-desc-row">
        <p className="admin-desc">
          {filtered.length}명
          {filtered.length !== users.length && ` / 전체 ${users.length}명`}
          {filtered.length > 0 && ` · ${safePage} / ${totalPages} 페이지`}
        </p>

        <button
          type="button"
          className="admin-btn small"
          onClick={() => setWidths(DEFAULT_WIDTHS)}
        >
          열 너비 초기화
        </button>
      </div>

      {actionError && <p className="admin-alert">{actionError}</p>}

      <div className="admin-table-wrap">
        <table className="admin-table admin-table-fixed">
          <thead>
            <tr>
              <ResizableTh colKey="id">ID</ResizableTh>
              <ResizableTh colKey="email">이메일</ResizableTh>
              <ResizableTh colKey="nickname">닉네임</ResizableTh>
              <ResizableTh colKey="role">권한</ResizableTh>
              <ResizableTh colKey="createdAt">가입일</ResizableTh>
              <ResizableTh colKey="lastLoginAt">마지막 접속</ResizableTh>
              <ResizableTh colKey="actions">관리</ResizableTh>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="admin-empty">
                  조건에 맞는 회원이 없습니다.
                </td>
              </tr>
            ) : (
              pageRows.map((user) => {
                const isSelf = me?.id === user.id;

                return (
                  <tr key={user.id}>
                    <td className="admin-td-clip">{user.id}</td>

                    <td className="admin-td-clip" title={user.email}>
                      {user.email}
                    </td>

                    <td className="admin-td-clip" title={user.nickname}>
                      {user.nickname}
                    </td>

                    <td className="admin-td-clip">
                      <span
                        className={`admin-badge ${user.role === "ADMIN" ? "admin" : ""}`}
                      >
                        {user.role === "ADMIN" ? "관리자" : "일반"}
                      </span>
                    </td>

                    <td className="admin-td-clip">
                      {formatDate(user.createdAt)}
                    </td>

                    <td className="admin-td-clip">
                      {formatDate(user.lastLoginAt)}
                    </td>

                    <td className="admin-td-actions admin-td-clip">
                      {isSelf ? (
                        <span className="admin-self-label">
                          현재 로그인한 계정
                        </span>
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
      </div>

      {totalPages > 1 && (
        <nav className="admin-pagination">
          <button
            type="button"
            className="admin-page-btn"
            onClick={() => setPage(safePage - 1)}
            disabled={safePage === 1}
          >
            이전
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              className={`admin-page-btn ${n === safePage ? "active" : ""}`}
              onClick={() => setPage(n)}
            >
              {n}
            </button>
          ))}

          <button
            type="button"
            className="admin-page-btn"
            onClick={() => setPage(safePage + 1)}
            disabled={safePage === totalPages}
          >
            다음
          </button>
        </nav>
      )}
    </>
  );
}

export default AdminUsers;