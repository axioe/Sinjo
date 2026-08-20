import "../css/Dictionary.css";

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as XLSX from "xlsx";

import { getWords, likeWord as likeWordApi } from "../api/wordApi";

const CATEGORY_OPTIONS = ["일상", "인터넷", "게임", "SNS", "직장", "기타"];

const INITIALS = [
  "ㄱ",
  "ㄲ",
  "ㄴ",
  "ㄷ",
  "ㄸ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅃ",
  "ㅅ",
  "ㅆ",
  "ㅇ",
  "ㅈ",
  "ㅉ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
  "#",
];

const ITEMS_PER_PAGE = 10;
const PAGE_GROUP_SIZE = 5;

function Dictionary() {
  const navigate = useNavigate();

  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [likingId, setLikingId] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);

  const [favoriteIds, setFavoriteIds] = useState(() => {
    try {
      const saved = localStorage.getItem("dictionaryFavorites");

      return saved ? JSON.parse(saved) : [];
    } catch (err) {
      console.error(err);
      return [];
    }
  });

  const [selectedCategory, setSelectedCategory] = useState("전체");

  const [selectedInitial, setSelectedInitial] = useState("전체");

  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  /**
   * 정렬
   *
   * latest : 가나다순
   * likes  : 좋아요순
   * views  : 조회순
   */
  const [sortType, setSortType] = useState("latest");

  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get("word") ?? "";

  const [keyword, setKeyword] = useState(query);

  useEffect(() => {
    setKeyword(query);
    setCurrentPage(1);
  }, [query]);

  /**
   * 한글 초성
   */
  const getInitial = (word = "") => {
    const first = word.trim().charAt(0);

    if (!first) {
      return "#";
    }

    const code = first.charCodeAt(0);

    if (code >= 0xac00 && code <= 0xd7a3) {
      const initialIndex = Math.floor((code - 0xac00) / 588);

      return INITIALS[initialIndex] ?? "#";
    }

    return "#";
  };

  /**
   * 데이터 불러오기
   */
  useEffect(() => {
    let alive = true;

    const fetchWords = async () => {
      try {
        const data = await getWords();

        if (alive) {
          setWords(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error(err);

        if (alive) {
          setError("신조어 데이터를 불러오는 데 실패했습니다.");
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };

    fetchWords();

    return () => {
      alive = false;
    };
  }, []);

  /**
   * 즐겨찾기 저장
   */
  useEffect(() => {
    localStorage.setItem("dictionaryFavorites", JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  const categories = ["전체", ...CATEGORY_OPTIONS];

  /**
   * 검색 + 필터 + 정렬
   *
   * 검색어가 있으면 검색어 조건을 먼저 만족시키고
   * 그 결과에 초성/카테고리/즐겨찾기를 적용한다.
   */
  const result = useMemo(() => {
    const q = query.trim().toLowerCase();

    const filtered = words.filter((item) => {
      /**
       * 검색어 우선
       */
      if (q) {
        const matchesSearch =
          item.word?.toLowerCase().includes(q) ||
          item.meaning?.toLowerCase().includes(q) ||
          item.example?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q) ||
          item.era?.toLowerCase().includes(q);

        if (!matchesSearch) {
          return false;
        }
      }

      /**
       * 카테고리
       */
      const itemCategory = item.category?.trim() || "기타";

      if (selectedCategory !== "전체" && itemCategory !== selectedCategory) {
        return false;
      }

      /**
       * 초성
       */
      if (
        selectedInitial !== "전체" &&
        getInitial(item.word) !== selectedInitial
      ) {
        return false;
      }

      /**
       * 즐겨찾기
       */
      if (showFavoritesOnly && !favoriteIds.includes(item.id)) {
        return false;
      }

      return true;
    });

    /**
     * 정렬
     */
    return filtered.sort((a, b) => {
      if (sortType === "likes") {
        const likesDiff = (b.likes ?? 0) - (a.likes ?? 0);

        if (likesDiff !== 0) {
          return likesDiff;
        }

        return (a.word ?? "").localeCompare(b.word ?? "", "ko");
      }

      if (sortType === "views") {
        const viewsDiff = (b.views ?? 0) - (a.views ?? 0);

        if (viewsDiff !== 0) {
          return viewsDiff;
        }

        return (a.word ?? "").localeCompare(b.word ?? "", "ko");
      }

      return (a.word ?? "").localeCompare(b.word ?? "", "ko", {
        sensitivity: "base",
      });
    });
  }, [
    words,
    query,
    selectedCategory,
    selectedInitial,
    showFavoritesOnly,
    favoriteIds,
    sortType,
  ]);

  const totalPages = Math.max(1, Math.ceil(result.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedWords = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

    return result.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [result, currentPage]);

  const currentPageGroup = Math.ceil(currentPage / PAGE_GROUP_SIZE);

  const startPage = (currentPageGroup - 1) * PAGE_GROUP_SIZE + 1;

  const endPage = Math.min(startPage + PAGE_GROUP_SIZE - 1, totalPages);

  const pageNumbers = Array.from(
    {
      length: endPage - startPage + 1,
    },
    (_, index) => startPage + index,
  );

  /**
   * 조회수에 따라 카드 색상을 결정
   *
   * 글자색이 아니라 카드 배경색이 진해진다.
   */
  const getViewLevel = (views = 0) => {
    if (views >= 1000) {
      return 5;
    }

    if (views >= 500) {
      return 4;
    }

    if (views >= 200) {
      return 3;
    }

    if (views >= 50) {
      return 2;
    }

    if (views > 0) {
      return 1;
    }

    return 0;
  };

  const goToPage = (page) => {
    const safePage = Math.min(Math.max(page, 1), totalPages);

    setCurrentPage(safePage);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const goPreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const goNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const goPreviousGroup = () => {
    if (currentPageGroup > 1) {
      const previousGroupFirstPage =
        (currentPageGroup - 2) * PAGE_GROUP_SIZE + 1;

      goToPage(previousGroupFirstPage);
    }
  };

  const goNextGroup = () => {
    const nextGroupFirstPage = currentPageGroup * PAGE_GROUP_SIZE + 1;

    if (nextGroupFirstPage <= totalPages) {
      goToPage(nextGroupFirstPage);
    }
  };

  /**
   * 검색
   */
  const searchWord = () => {
    const trimmed = keyword.trim();

    setSearchParams(trimmed ? { word: trimmed } : {}, {
      replace: true,
    });

    setCurrentPage(1);
  };

  /**
   * 검색 초기화
   */
  const resetSearch = () => {
    setKeyword("");

    setSearchParams(
      {},
      {
        replace: true,
      },
    );

    setCurrentPage(1);
  };

  /**
   * 좋아요
   */
  const likeWord = async (id) => {
    if (likingId !== null) {
      return;
    }

    setLikingId(id);

    try {
      const updated = await likeWordApi(id);

      setWords((prev) =>
        prev.map((item) =>
          item.id === updated.id
            ? {
                ...item,
                ...updated,
              }
            : item,
        ),
      );
    } catch (err) {
      console.error(err);

      setError("좋아요 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLikingId(null);
    }
  };

  /**
   * 즐겨찾기
   */
  const toggleFavorite = (id) => {
    setFavoriteIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((favoriteId) => favoriteId !== id);
      }

      return [...prev, id];
    });
  };

  const isFavorite = (id) => favoriteIds.includes(id);

  const resetFavorites = () => {
    setFavoriteIds([]);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSelectedCategory("전체");
    setSelectedInitial("전체");
    setShowFavoritesOnly(false);
    setSortType("latest");
    setCurrentPage(1);
  };

  const changeCategory = (category) => {
    setSelectedCategory(category);

    setShowFavoritesOnly(false);

    setCurrentPage(1);
  };

  const changeInitial = (initial) => {
    setSelectedInitial(initial);

    setCurrentPage(1);
  };

  const toggleFavoritesOnly = () => {
    setShowFavoritesOnly((prev) => !prev);

    setCurrentPage(1);
  };

  /**
   * 엑셀 다운로드
   */
  const downloadExcel = () => {
    if (words.length === 0) {
      alert("다운로드할 신조어 데이터가 없습니다.");

      return;
    }

    const excelData = words.map((item, index) => ({
      번호: index + 1,
      단어: item.word ?? "",
      뜻: item.meaning ?? "",
      예문: item.example ?? "",
      카테고리: item.category?.trim() || "기타",
      시대: item.era ?? "",
      좋아요: item.likes ?? 0,
      조회수: item.views ?? 0,
      즐겨찾기: isFavorite(item.id) ? "Y" : "N",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 20 },
      { wch: 50 },
      { wch: 60 },
      { wch: 15 },
      { wch: 15 },
      { wch: 10 },
      { wch: 10 },
      { wch: 12 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "신조어 사전");

    XLSX.writeFile(workbook, "신조어_사전.xlsx");
  };

  /**
   * 카드 클릭
   */
  const openWordDetail = (id) => {
    navigate(`/dictionary/${id}`);
  };

  if (loading) {
    return (
      <div className="dictionary-page">
        <h1>📖 신조어 사전</h1>

        <p>신조어를 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="dictionary-page">
      <h1>📖 신조어 사전</h1>

      <p className="dictionary-subtitle">
        모르는 신조어의 뜻과 사용 예시를 확인하세요.
      </p>

      {error && <p className="no-result">{error}</p>}

      {/* 검색 */}

      <div className="dictionary-search">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent?.isComposing) {
              searchWord();
            }
          }}
          placeholder="찾고 싶은 신조어 또는 뜻을 입력하세요"
          aria-label="신조어 검색"
        />

        <button type="button" onClick={searchWord}>
          검색
        </button>

        {query && (
          <button type="button" onClick={resetSearch} className="reset-button">
            전체 보기
          </button>
        )}
      </div>

      {/* 엑셀 */}

      <div className="excel-download-area">
        <button
          type="button"
          className="excel-download-button"
          onClick={downloadExcel}
        >
          📥 엑셀 다운로드
        </button>
      </div>

      {/* 카테고리 */}

      <div className="category-list">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={
              selectedCategory === category && !showFavoritesOnly
                ? "category-button active"
                : "category-button"
            }
            onClick={() => changeCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* 초성 */}

      <div className="initial-list">
        <button
          type="button"
          className={
            selectedInitial === "전체"
              ? "initial-button active"
              : "initial-button"
          }
          onClick={() => changeInitial("전체")}
        >
          전체
        </button>

        {INITIALS.map((initial) => (
          <button
            key={initial}
            type="button"
            className={
              selectedInitial === initial
                ? "initial-button active"
                : "initial-button"
            }
            onClick={() => changeInitial(initial)}
          >
            {initial}
          </button>
        ))}
      </div>

      {/* 정렬 */}

      <div className="sort-filter-area">
        <span className="sort-label">정렬</span>

        <button
          type="button"
          className={
            sortType === "latest" ? "sort-button active" : "sort-button"
          }
          onClick={() => {
            setSortType("latest");
            setCurrentPage(1);
          }}
        >
          가나다순
        </button>

        <button
          type="button"
          className={
            sortType === "likes" ? "sort-button active" : "sort-button"
          }
          onClick={() => {
            setSortType("likes");
            setCurrentPage(1);
          }}
        >
          ❤️ 좋아요순
        </button>

        <button
          type="button"
          className={
            sortType === "views" ? "sort-button active" : "sort-button"
          }
          onClick={() => {
            setSortType("views");
            setCurrentPage(1);
          }}
        >
          👀 조회순
        </button>
      </div>

      {/* 즐겨찾기 */}

      <div className="favorite-filter-area">
        <button
          type="button"
          className={
            showFavoritesOnly
              ? "category-button favorite-filter active"
              : "category-button favorite-filter"
          }
          onClick={toggleFavoritesOnly}
        >
          ⭐ 즐겨찾기
        </button>

        {showFavoritesOnly && favoriteIds.length > 0 && (
          <button
            type="button"
            className="favorite-reset-button"
            onClick={resetFavorites}
          >
            즐겨찾기 전체 해제
          </button>
        )}

        {(selectedCategory !== "전체" ||
          selectedInitial !== "전체" ||
          showFavoritesOnly ||
          sortType !== "latest") && (
          <button
            type="button"
            className="filter-reset-button"
            onClick={resetFilters}
          >
            필터 초기화
          </button>
        )}
      </div>

      {/* 필터 상태 */}

      {(selectedCategory !== "전체" ||
        selectedInitial !== "전체" ||
        showFavoritesOnly ||
        sortType !== "latest") && (
        <div className="filter-info">
          <span>현재 필터</span>

          {selectedCategory !== "전체" && <strong>{selectedCategory}</strong>}

          {selectedInitial !== "전체" && <strong>{selectedInitial}</strong>}

          {showFavoritesOnly && <strong>⭐ 즐겨찾기</strong>}

          {sortType === "likes" && <strong>❤️ 좋아요순</strong>}

          {sortType === "views" && <strong>👁 조회순</strong>}

          <span className="filter-count">{result.length}개</span>
        </div>
      )}

      {showFavoritesOnly && (
        <div className="favorite-info">
          ⭐ 즐겨찾기한 신조어 <strong>{favoriteIds.length}개</strong>
        </div>
      )}

      {result.length > 0 && (
        <div className="pagination-info">
          전체 <strong>{result.length}</strong>개<span>·</span>
          <strong>{currentPage}</strong> / {totalPages} 페이지
        </div>
      )}

      {/* 사전 */}

      <div className="word-list">
        {paginatedWords.length > 0 ? (
          <div className="category-word-list">
            {paginatedWords.map((item) => {
              const viewLevel = getViewLevel(item.views ?? 0);

              return (
                <div
                  className={`word-card view-level-${viewLevel}`}
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openWordDetail(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openWordDetail(item.id);
                    }
                  }}
                >
                  <div className="word-card-header">
                    <div className="word-title-area">
                      <div className="word-meta">
                        <span className="word-category">
                          {item.category?.trim() || "기타"}
                        </span>

                        {item.era?.trim() && (
                          <span className="word-era">{item.era}</span>
                        )}
                      </div>

                      <h2>{item.word}</h2>
                    </div>

                    <div className="word-actions">
                      <button
                        type="button"
                        className={
                          isFavorite(item.id)
                            ? "card-favorite-button active"
                            : "card-favorite-button"
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(item.id);
                        }}
                      >
                        {isFavorite(item.id) ? "⭐" : "☆"}
                      </button>

                      <button
                        type="button"
                        className="card-like-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          likeWord(item.id);
                        }}
                        disabled={likingId === item.id}
                      >
                        ❤️ {item.likes ?? 0}
                      </button>
                    </div>
                  </div>

                  <div className="meaning">
                    <b>뜻</b>
                    <p>{item.meaning}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="no-result">
            {showFavoritesOnly
              ? "즐겨찾기한 신조어가 없습니다."
              : words.length === 0
                ? "아직 등록된 신조어가 없습니다."
                : "검색 결과가 없습니다."}
          </div>
        )}
      </div>

      {/* 페이지네이션 */}

      {result.length > 0 && totalPages > 1 && (
        <nav className="pagination" aria-label="신조어 페이지 이동">
          <button
            type="button"
            className="pagination-button group-button"
            onClick={goPreviousGroup}
            disabled={currentPageGroup === 1}
          >
            {"<<"}
          </button>

          <button
            type="button"
            className="pagination-button"
            onClick={goPreviousPage}
            disabled={currentPage === 1}
          >
            {"<"}
          </button>

          <div className="pagination-numbers">
            {pageNumbers.map((page) => (
              <button
                key={page}
                type="button"
                className={
                  currentPage === page
                    ? "pagination-number active"
                    : "pagination-number"
                }
                onClick={() => goToPage(page)}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="pagination-button"
            onClick={goNextPage}
            disabled={currentPage === totalPages}
          >
            {">"}
          </button>

          <button
            type="button"
            className="pagination-button group-button"
            onClick={goNextGroup}
            disabled={currentPageGroup * PAGE_GROUP_SIZE >= totalPages}
          >
            {">>"}
          </button>
        </nav>
      )}
    </div>
  );
}

export default Dictionary;
