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

function AdminProposals() {
  const navigate = useNavigate();

  const [proposals, setProposals] = useState([]);
  const [status, setStatus] = useState("ALL");
  const [keyword, setKeyword] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProposals = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminProposals();

      setProposals(data ?? []);
    } catch (err) {
      console.error(err);

      setError(err.message || "신조어 제안 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProposals();
  }, []);

  const filteredProposals = useMemo(() => {
    const search = keyword.trim().toLowerCase();

    return proposals.filter((item) => {
      const matchesStatus = status === "ALL" || item.status === status;

      if (!search) {
        return matchesStatus;
      }

      const target = [item.proposedWord, item.meaning, item.nickname]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && target.includes(search);
    });
  }, [proposals, status, keyword]);

  if (loading) {
    return (
      <div className="admin-proposals">
        <div className="admin-proposals-loading">
          신조어 제안 목록을 불러오는 중입니다...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-proposals">
      {/* 헤더 */}
      <div className="admin-proposals-header">
        <div>
          <h2>신조어 제안 관리</h2>
          <p>사용자가 제안한 신조어를 검수하고 사전 등록 여부를 관리합니다.</p>
        </div>

        <button
          type="button"
          onClick={loadProposals}
          className="admin-proposals-refresh"
        >
          새로고침
        </button>
      </div>

      {/* 에러 */}
      {error && <div className="admin-proposals-error">{error}</div>}

      {/* 필터 / 검색 */}
      <div className="admin-proposals-toolbar">
        <div className="admin-proposals-status-filter">
          <button
            type="button"
            className={status === "ALL" ? "active" : ""}
            onClick={() => setStatus("ALL")}
          >
            전체
          </button>

          {Object.entries(STATUS_LABEL).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={status === key ? "active" : ""}
              onClick={() => setStatus(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <input
          type="search"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="신조어, 의미, 작성자 검색"
          className="admin-proposals-search"
        />
      </div>

      {/* 개수 */}
      <div className="admin-proposals-count">
        총 {filteredProposals.length}건
      </div>

      {/* 목록 */}
      {filteredProposals.length === 0 ? (
        <div className="admin-proposals-empty">
          조건에 맞는 신조어 제안이 없습니다.
        </div>
      ) : (
        <div className="admin-proposals-table-wrap">
          <div className="admin-proposals-table">
            <div className="admin-proposals-table-head">
              <span>신조어</span>
              <span>의미</span>
              <span>작성자</span>
              <span>상태</span>
              <span>댓글</span>
              <span>등록일</span>
              <span></span>
            </div>

            {filteredProposals.map((item) => (
              <div
                key={item.id}
                className="admin-proposals-table-row"
                onClick={() => navigate(`/admin/proposals/${item.id}`)}
              >
                <strong className="admin-proposal-word">
                  {item.proposedWord}
                </strong>

                <span className="proposal-meaning">{item.meaning}</span>

                <span>{item.nickname || "-"}</span>

                <span>
                  <StatusBadge status={item.status} />
                </span>

                <span>{item.commentCount ?? 0}</span>

                <span>{formatDate(item.createdAt)}</span>

                <button
                  type="button"
                  className="admin-proposal-detail-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/admin/proposals/${item.id}`);
                  }}
                >
                  상세
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`admin-proposal-status status-${status}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("ko-KR");
}

export default AdminProposals;
