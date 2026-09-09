import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ThumbsDown, ThumbsUp } from "lucide-react";

import { getProposals, getProposalSuggestions } from "../../api/proposalApi";
import "../../css/proposal/ProposalList.css";

function ProposalList() {
  const [proposals, setProposals] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 검색 / 정렬
  const [searchInput, setSearchInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  // 자동완성
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sortType, setSortType] = useState("LATEST");

  // 페이징
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const PAGE_SIZE = 10;

  useEffect(() => {
    loadProposals(currentPage, searchKeyword, sortType);
  }, [currentPage, searchKeyword, sortType]);

  const loadProposals = async (page = 0, keyword = "", sort = "LATEST") => {
    try {
      setLoading(true);
      setError("");

      const data = await getProposals(page, PAGE_SIZE, keyword, sort);

      setProposals(data.content ?? []);
      setTotalPages(data.totalPages ?? 0);
      setTotalElements(data.totalElements ?? 0);
    } catch (err) {
      console.error("신조어 제안 목록 조회 실패:", err);

      setError(err.message || "신조어 제안 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };
  const loadSuggestions = async (keyword) => {
    if (!keyword.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const data = await getProposalSuggestions(keyword);

      setSuggestions(data ?? []);
      setShowSuggestions(true);
    } catch (err) {
      console.error("자동완성 조회 실패:", err);
      setSuggestions([]);
      setShowSuggestions(false);
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
   * 검색어 변경
   */
  const handleSearchChange = async (e) => {
    const value = e.target.value;

    setSearchInput(value);

    if (value.trim() === "") {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    await loadSuggestions(value);
  };

  const handleSearch = (keyword = searchInput) => {
    const value = keyword.trim();

    setSearchKeyword(value);
    setSearchInput(value);
    setCurrentPage(0);

    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }

    if (e.key === "Escape") {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  /*
   * 정렬 변경
   */
  const handleSortChange = (e) => {
    setSortType(e.target.value);
    setCurrentPage(0);
  };

  /*
   * 페이지 변경
   */
  const handlePageChange = (page) => {
    if (page < 0 || page >= totalPages) {
      return;
    }

    setCurrentPage(page);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /*
   * 검색 초기화
   */
  const handleResetSearch = () => {
    setSearchInput("");
    setSearchKeyword("");
    setSuggestions([]);
    setShowSuggestions(false);
    setCurrentPage(0);
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
  const getPageNumbers = () => {
    const pages = [];

    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages + 2) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }

      return pages;
    }

    pages.push(0);

    if (currentPage > 3) {
      pages.push("ellipsis-start");
    }

    const start = Math.max(1, currentPage - 1);
    const end = Math.min(totalPages - 2, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 4) {
      pages.push("ellipsis-end");
    }

    pages.push(totalPages - 1);

    return pages;
  };

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

            <button
              type="button"
              onClick={() =>
                loadProposals(currentPage, searchKeyword, sortType)
              }
            >
              다시 시도
            </button>
          </div>
        )}

        {/* Search / Sort */}
        {!error && (
          <div className="proposal-list-tools">
            <div className="proposal-search-wrapper">
              <div className="proposal-search">
                <Search className="proposal-search-icon" />

                <input
                  type="text"
                  value={searchInput}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                  onFocus={() => {
                    if (searchInput.trim() && suggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  placeholder="신조어, 의미, 작성자를 검색해보세요."
                />

                {searchInput.trim() && (
                  <button
                    type="button"
                    className="proposal-search-button"
                    onClick={() => handleSearch()}
                    aria-label="검색"
                  >
                    <Search size={19} />
                  </button>
                )}
              </div>

              {showSuggestions && suggestions.length > 0 && (
                <div className="proposal-search-suggestions">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="proposal-search-suggestion"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSearch(suggestion);
                      }}
                    >
                      <Search size={16} />

                      <span>{suggestion}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <select
              className="proposal-sort"
              value={sortType}
              onChange={handleSortChange}
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
        {!error && proposals.length > 0 && (
          <section className="proposal-list-card">
            <div className="proposal-list-card-header">
              <strong>
                신조어 제안 <span>{totalElements}</span>
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

        {/* 검색 결과 없음 */}
        {!error && totalElements === 0 && searchKeyword.trim() !== "" && (
          <section className="proposal-empty">
            <div className="proposal-empty-icon">
              <Search size={30} strokeWidth={1.8} />
            </div>

            <h2>검색 결과가 없습니다.</h2>

            <p>다른 검색어로 다시 검색해보세요.</p>

            <button
              type="button"
              className="proposal-empty-button"
              onClick={handleResetSearch}
            >
              검색 초기화
            </button>
          </section>
        )}

        {/* 등록된 제안 자체가 없음 */}
        {!error && totalElements === 0 && searchKeyword.trim() === "" && (
          <section className="proposal-empty">
            <div className="proposal-empty-icon">✨</div>

            <h2>아직 등록된 신조어 제안이 없습니다.</h2>

            <p>여러분이 알고 있는 새로운 표현을 가장 먼저 제안해보세요.</p>

            <Link to="/proposals/new" className="proposal-empty-button">
              첫 번째 신조어 제안하기
            </Link>
          </section>
        )}

        {/* Pagination */}
        {!error && totalPages > 1 && (
          <nav className="proposal-pagination">
            <button
              type="button"
              className="proposal-pagination-button"
              disabled={currentPage === 0}
              onClick={() => handlePageChange(currentPage - 1)}
              aria-label="이전 페이지"
            >
              ‹
            </button>

            {getPageNumbers().map((pageNumber, index) => {
              if (typeof pageNumber === "string") {
                return (
                  <span
                    key={pageNumber}
                    className="proposal-pagination-ellipsis"
                  >
                    ···
                  </span>
                );
              }

              return (
                <button
                  key={pageNumber}
                  type="button"
                  className={`proposal-pagination-number ${
                    currentPage === pageNumber ? "active" : ""
                  }`}
                  onClick={() => handlePageChange(pageNumber)}
                  aria-label={`${pageNumber + 1}페이지`}
                  aria-current={currentPage === pageNumber ? "page" : undefined}
                >
                  {pageNumber + 1}
                </button>
              );
            })}

            <button
              type="button"
              className="proposal-pagination-button"
              disabled={currentPage === totalPages - 1}
              onClick={() => handlePageChange(currentPage + 1)}
              aria-label="다음 페이지"
            >
              ›
            </button>
          </nav>
        )}
      </div>
    </main>
  );
}

export default ProposalList;
