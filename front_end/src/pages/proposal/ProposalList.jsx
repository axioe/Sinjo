import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ThumbsDown, ThumbsUp } from "lucide-react";

import { getProposals } from "../../api/proposalApi";
import "../../css/proposal/ProposalList.css";

function ProposalList() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 검색 / 정렬
  const [searchKeyword, setSearchKeyword] = useState("");
  const [sortType, setSortType] = useState("LATEST");

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
      case "DISCUSSION":
        return "의견 수렴 중";

      case "REVIEW_REQUESTED":
        return "관리자 검수 대기";

      case "AI_REVIEWED":
        return "AI 검수 완료";

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
      case "DISCUSSION":
        return "discussion";

      case "REVIEW_REQUESTED":
        return "review-requested";

      case "AI_REVIEWED":
        return "ai-reviewed";

      case "APPROVED":
        return "approved";

      case "REJECTED":
        return "rejected";

      default:
        return "pending";
    }
  };

  /*
   * 검색 + 정렬
   */
  const filteredProposals = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    let result = proposals.filter((proposal) => {
      if (!keyword) {
        return true;
      }

      return (
        proposal.proposedWord?.toLowerCase().includes(keyword) ||
        proposal.meaning?.toLowerCase().includes(keyword) ||
        proposal.nickname?.toLowerCase().includes(keyword)
      );
    });

    result = [...result].sort((a, b) => {
      switch (sortType) {
        case "POPULAR": {
          const scoreA =
            (a.likes ?? 0) + (a.commentCount ?? 0) * 2 + (a.views ?? 0) * 0.1;

          const scoreB =
            (b.likes ?? 0) + (b.commentCount ?? 0) * 2 + (b.views ?? 0) * 0.1;

          return scoreB - scoreA;
        }

        case "LIKES":
          return (b.likes ?? 0) - (a.likes ?? 0);

        case "COMMENTS":
          return (b.commentCount ?? 0) - (a.commentCount ?? 0);

        case "VIEWS":
          return (b.views ?? 0) - (a.views ?? 0);

        case "LATEST":
        default:
          return (
            new Date(b.createdAt ?? 0).getTime() -
            new Date(a.createdAt ?? 0).getTime()
          );
      }
    });

    return result;
  }, [proposals, searchKeyword, sortType]);

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

        {/* Search / Sort */}
        {!error && proposals.length > 0 && (
          <div className="proposal-list-tools">
            <div className="proposal-search">
              <Search className="proposal-search-icon" />

              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="신조어, 의미, 작성자를 검색해보세요."
              />
            </div>

            <select
              className="proposal-sort"
              value={sortType}
              onChange={(e) => setSortType(e.target.value)}
            >
              <option value="LATEST">최신순</option>
              <option value="POPULAR">인기순</option>
              <option value="LIKES">좋아요순</option>
              <option value="COMMENTS">댓글순</option>
              <option value="VIEWS">조회순</option>
            </select>
          </div>
        )}

        {/* List */}
        {!error && filteredProposals.length > 0 && (
          <section className="proposal-list-card">
            <div className="proposal-list-card-header">
              <strong>
                신조어 제안 <span>{filteredProposals.length}</span>
              </strong>
            </div>

            <div className="proposal-items">
              {filteredProposals.map((proposal) => (
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

                      <span className="proposal-vote-meta">
                        <ThumbsUp className="proposal-vote-meta-icon" />
                        {proposal.likes ?? 0}
                      </span>

                      <span className="proposal-meta-dot">·</span>

                      <span className="proposal-vote-meta">
                        <ThumbsDown className="proposal-vote-meta-icon" />
                        {proposal.dislikes ?? 0}
                      </span>
                    </div>
                  </div>

                  <span className="proposal-item-arrow">→</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Search result empty */}
        {!error && proposals.length > 0 && filteredProposals.length === 0 && (
          <section className="proposal-empty">
            <div className="proposal-empty-icon">
              <Search size={30} strokeWidth={1.8} />
            </div>

            <h2>검색 결과가 없습니다.</h2>

            <p>다른 검색어로 다시 검색해보세요.</p>

            <button
              type="button"
              className="proposal-empty-button"
              onClick={() => setSearchKeyword("")}
            >
              검색 초기화
            </button>
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
