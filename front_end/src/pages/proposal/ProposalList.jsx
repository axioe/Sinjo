import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProposals } from "../../api/proposalApi";
import "../../css/proposal/ProposalList.css";

function ProposalList() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProposals();
  }, []);

  const loadProposals = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getProposals();
      setProposals(data ?? []);
    } catch (err) {
      console.error("신조어 제안 목록 조회 실패:", err);

      setError(err.message || "신조어 제안 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "PENDING":
        return "검토 중";

      case "APPROVED":
        return "등록 완료";

      case "REJECTED":
        return "반려";

      default:
        return status || "검토 중";
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "APPROVED":
        return "approved";

      case "REJECTED":
        return "rejected";

      default:
        return "pending";
    }
  };

  if (loading) {
    return (
      <main className="proposal-list">
        <div className="proposal-list-inner">
          <div className="proposal-loading">
            신조어 제안을 불러오는 중입니다...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="proposal-list">
      <div className="proposal-list-inner">
        {/* Header */}
        <header className="proposal-list-header">
          <div>
            <span className="proposal-list-eyebrow">COMMUNITY</span>

            <h1>신조어 제안</h1>

            <p>새로운 신조어를 제안하고 다른 사용자들과 함께 이야기해보세요.</p>
          </div>

          <Link to="/proposals/new" className="proposal-create-link">
            + 신조어 제안하기
          </Link>
        </header>

        {/* Error */}
        {error && (
          <div className="proposal-list-error">
            <span>{error}</span>

            <button type="button" onClick={loadProposals}>
              다시 시도
            </button>
          </div>
        )}

        {/* List */}
        {!error && proposals.length > 0 && (
          <section className="proposal-list-card">
            <div className="proposal-list-card-header">
              <strong>
                신조어 제안 <span>{proposals.length}</span>
              </strong>
            </div>

            <div className="proposal-items">
              {proposals.map((proposal) => (
                <Link
                  key={proposal.id}
                  to={`/proposals/${proposal.id}`}
                  className="proposal-item"
                >
                  <div className="proposal-item-main">
                    <div className="proposal-item-top">
                      <h2>{proposal.proposedWord}</h2>

                      <span
                        className={`proposal-status ${getStatusClass(
                          proposal.status,
                        )}`}
                      >
                        {getStatusLabel(proposal.status)}
                      </span>
                    </div>

                    <p className="proposal-item-meaning">{proposal.meaning}</p>

                    <div className="proposal-item-meta">
                      <span>{proposal.nickname}</span>

                      <span className="proposal-meta-dot">·</span>

                      <span>조회 {proposal.views ?? 0}</span>

                      <span className="proposal-meta-dot">·</span>

                      <span>댓글 {proposal.commentCount ?? 0}</span>

                      <span className="proposal-meta-dot">·</span>

                      <span>좋아요 {proposal.likes ?? 0}</span>
                    </div>
                  </div>

                  <span className="proposal-item-arrow">→</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty */}
        {!error && proposals.length === 0 && (
          <section className="proposal-empty">
            <div className="proposal-empty-icon">✨</div>

            <h2>아직 등록된 신조어 제안이 없습니다.</h2>

            <p>여러분이 알고 있는 새로운 표현을 가장 먼저 제안해보세요.</p>

            <Link to="/proposals/new" className="proposal-empty-button">
              첫 번째 신조어 제안하기
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}

export default ProposalList;
