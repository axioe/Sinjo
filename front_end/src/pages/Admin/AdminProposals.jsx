import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAdminProposals } from "../../api/adminProposalApi";
import "../../css/admin/AdminProposal.css";

const STATUS_LABEL = {
  DISCUSSION: "토의 중",
  REVIEW_REQUESTED: "검수 요청",
  AI_REVIEWED: "AI 검수 완료",
  APPROVED: "승인",
  REJECTED: "반려",
};

const STATUSES = [
  "ALL",
  "DISCUSSION",
  "REVIEW_REQUESTED",
  "AI_REVIEWED",
  "APPROVED",
  "REJECTED",
];

const label = (s) => (s === "ALL" ? "전체" : STATUS_LABEL[s] || s || "-");

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
};

export default function AdminProposals() {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState([]);
  const [status, setStatus] = useState("ALL");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAdminProposals();
      setProposals(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError(e.message || "관리자 제안 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(() => {
    const c = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    c.ALL = proposals.length;
    proposals.forEach((p) => {
      if (c[p.status] !== undefined) c[p.status]++;
    });
    return c;
  }, [proposals]);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return proposals.filter((p) => {
      if (status !== "ALL" && p.status !== status) return false;
      if (!q) return true;
      return [p.proposedWord, p.meaning, p.nickname, p.userNickname, p.email]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [proposals, status, keyword]);

  if (loading)
    return (
      <div className="admin-page">
        <div className="admin-loading">제안 목록을 불러오는 중입니다...</div>
      </div>
    );

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">SINJO ADMIN</p>
          <h1>신조어 제안 관리</h1>
          <p className="admin-description">
            제안을 검수하고 승인 또는 반려합니다.
          </p>
        </div>
        <button className="admin-refresh-button" onClick={load}>
          새로고침
        </button>
      </header>

      {error && (
        <div className="admin-error">
          <span>{error}</span>
          <button onClick={load}>다시 시도</button>
        </div>
      )}

      <section className="admin-summary">
        {STATUSES.map((s) => (
          <button
            key={s}
            className={`admin-summary-card ${status === s ? "active" : ""}`}
            onClick={() => setStatus(s)}
          >
            <span>{label(s)}</span>
            <strong>{counts[s]}</strong>
          </button>
        ))}
      </section>

      <section className="admin-toolbar">
        <div className="admin-filter-group">
          {STATUSES.map((s) => (
            <button
              key={s}
              className={`admin-filter ${status === s ? "active" : ""}`}
              onClick={() => setStatus(s)}
            >
              {label(s)}
            </button>
          ))}
        </div>
        <input
          className="admin-search"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="단어, 의미, 작성자로 검색"
        />
      </section>

      <section className="admin-table-card">
        <div className="admin-table-header">
          <h2>제안 목록</h2>
          <span>{filtered.length}개의 제안</span>
        </div>
        {filtered.length === 0 ? (
          <div className="admin-empty">조건에 맞는 제안이 없습니다.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>단어</th>
                  <th>의미</th>
                  <th>작성자</th>
                  <th>추천</th>
                  <th>비추천</th>
                  <th>댓글</th>
                  <th>상태</th>
                  <th>등록일</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/admin/proposals/${p.id}`)}
                  >
                    <td>{p.id}</td>
                    <td className="proposal-word">{p.proposedWord || "-"}</td>
                    <td className="proposal-meaning">{p.meaning || "-"}</td>
                    <td>{p.nickname || p.userNickname || p.email || "-"}</td>
                    <td>{p.likes ?? 0}</td>
                    <td>{p.dislikes ?? 0}</td>
                    <td>{p.commentCount ?? 0}</td>
                    <td>
                      <span
                        className={`status-badge status-${(p.status || "").toLowerCase()}`}
                      >
                        {label(p.status)}
                      </span>
                    </td>
                    <td>{formatDate(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
