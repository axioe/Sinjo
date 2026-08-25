import "../css/Dictionary.css";

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as XLSX from "xlsx";

import { getWords, likeWord as likeWordApi } from "../api/wordApi";
import {
  getMyFavorites,
  addFavorite,
  removeFavorite,
} from "../api/favoriteApi";

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

  const [favoriteIds, setFavoriteIds] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [selectedInitial, setSelectedInitial] = useState("전체");
  const [selectedYear, setSelectedYear] = useState("전체");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  const [sortType, setSortType] = useState("latest");

  const [searchParams, setSearchParams] = useSearchParams();

  const query = searchParams.get("word") ?? "";

  const [keyword, setKeyword] = useState(query);

  /*
   * =========================================================
   * 엑셀 다운로드 설정
   * =========================================================
   */

  const [showExcelModal, setShowExcelModal] = useState(false);

  /*
   * 처음에는 모두 false
   */
  const [excelFields, setExcelFields] = useState({
    word: false,
    meaning: false,
    example: false,
    category: false,
    era: false,
  });

  /*
   * 세부 선택
   *
   * 처음에는 모두 선택되지 않은 상태
   */
  const [excelInitials, setExcelInitials] = useState([]);
  const [excelCategories, setExcelCategories] = useState([]);
  const [excelYears, setExcelYears] = useState([]);

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
   * 년도 추출
   */
  const getYear = (era = "") => {
    const match = String(era).match(/\b(19|20)\d{2}\b/);

    return match ? match[0] : "";
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
   * 즐겨찾기 불러오기 (REQ-MY-01)
   *
   * [수정] localStorage 대신 서버 목록으로 별표 상태를 맞춘다.
   * 브라우저에만 저장하면 다른 기기에서 안 보이고 마이페이지와도 어긋난다.
   */
  useEffect(() => {
    let alive = true;

    getMyFavorites(0, 1000)
      .then((list) => {
        if (alive) setFavoriteIds(list.map((f) => f.wordId));
      })
      .catch(console.error);

    return () => {
      alive = false;
    };
  }, []);

  const categories = ["전체", ...CATEGORY_OPTIONS];

  /**
   * 년도 목록
   */
  const years = useMemo(() => {
    const yearSet = new Set();

    words.forEach((item) => {
      const year = getYear(item.era);

      if (year) {
        yearSet.add(year);
      }
    });

    return [
      "전체",
      ...Array.from(yearSet).sort((a, b) => Number(b) - Number(a)),
    ];
  }, [words]);

  /*
   * =========================================================
   * 엑셀용 세부 목록
   * =========================================================
   */

  const excelYearOptions = useMemo(() => {
    return years.filter((year) => year !== "전체");
  }, [years]);

  /*
   * =========================================================
   * 검색 + 필터 + 정렬
   * =========================================================
   */

  const result = useMemo(() => {
    const q = query.trim().toLowerCase();

    const filtered = words.filter((item) => {
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

      const itemCategory = item.category?.trim() || "기타";

      if (selectedCategory !== "전체" && itemCategory !== selectedCategory) {
        return false;
      }

      if (
        selectedInitial !== "전체" &&
        getInitial(item.word) !== selectedInitial
      ) {
        return false;
      }

      if (selectedYear !== "전체") {
        const itemYear = getYear(item.era);

        if (itemYear !== selectedYear) {
          return false;
        }
      }

      if (showFavoritesOnly && !favoriteIds.includes(item.id)) {
        return false;
      }

      return true;
    });

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

      return (a.word ?? "").localeCompare(b.word ?? "", {
        sensitivity: "base",
      });
    });
  }, [
    words,
    query,
    selectedCategory,
    selectedInitial,
    selectedYear,
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
   * 조회수에 따른 카드 색상
   */
  const getViewLevel = (views = 0) => {
    if (views >= 1000) return 5;
    if (views >= 500) return 4;
    if (views >= 200) return 3;
    if (views >= 50) return 2;
    if (views > 0) return 1;

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

    setSearchParams(
      trimmed
        ? {
            word: trimmed,
          }
        : {},
      {
        replace: true,
      },
    );

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
   * 즐겨찾기 토글 (REQ-MY-01)
   * 먼저 화면에 반영하고, 서버 요청이 실패하면 되돌린다.
   */
  const toggleFavorite = async (id) => {
    const wasFavorite = favoriteIds.includes(id);

    setFavoriteIds((prev) =>
      wasFavorite
        ? prev.filter((favoriteId) => favoriteId !== id)
        : [...prev, id],
    );

    try {
      if (wasFavorite) {
        await removeFavorite(id);
      } else {
        await addFavorite(id);
      }
    } catch (err) {
      console.error(err);

      setFavoriteIds((prev) =>
        wasFavorite
          ? [...prev, id]
          : prev.filter((favoriteId) => favoriteId !== id),
      );

      setError("즐겨찾기 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  };

  const isFavorite = (id) => favoriteIds.includes(id);

  const resetFavorites = async () => {
    const previousIds = [...favoriteIds];

    setFavoriteIds([]);
    setCurrentPage(1);

    try {
      await Promise.all(previousIds.map((id) => removeFavorite(id)));
    } catch (err) {
      console.error(err);

      setFavoriteIds(previousIds);
      setError("즐겨찾기 해제에 실패했습니다.");
    }
  };

  /**
   * 전체 필터 초기화
   */
  const resetFilters = () => {
    setSelectedCategory("전체");
    setSelectedInitial("전체");
    setSelectedYear("전체");
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

  const changeYear = (year) => {
    setSelectedYear(year);
    setCurrentPage(1);
  };

  const toggleFavoritesOnly = () => {
    setShowFavoritesOnly((prev) => !prev);
    setCurrentPage(1);
  };

  /*
   * =========================================================
   * 엑셀 모달 열기
   * =========================================================
   *
   * 중요:
   * 버튼을 누를 때마다 전체 체크 해제
   */

  const openExcelModal = () => {
    setExcelFields({
      word: false,
      meaning: false,
      example: false,
      category: false,
      era: false,
    });

    setExcelInitials([]);
    setExcelCategories([]);
    setExcelYears([]);

    setShowExcelModal(true);
  };

  const closeExcelModal = () => {
    setShowExcelModal(false);
  };

  /*
   * =========================================================
   * 엑셀 메인 항목 체크
   * =========================================================
   */

  const toggleExcelField = (field) => {
    setExcelFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));

    /*
     * 해당 항목을 해제하면 세부 선택도 초기화
     */
    if (field === "word") {
      setExcelInitials([]);
    }

    if (field === "category") {
      setExcelCategories([]);
    }

    if (field === "era") {
      setExcelYears([]);
    }
  };

  /*
   * =========================================================
   * 초성 선택
   * =========================================================
   */

  const toggleExcelInitial = (initial) => {
    setExcelInitials((prev) =>
      prev.includes(initial)
        ? prev.filter((item) => item !== initial)
        : [...prev, initial],
    );
  };

  /*
   * =========================================================
   * 카테고리 선택
   * =========================================================
   */

  const toggleExcelCategory = (category) => {
    setExcelCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category],
    );
  };

  /*
   * =========================================================
   * 년도 선택
   * =========================================================
   */

  const toggleExcelYear = (year) => {
    setExcelYears((prev) =>
      prev.includes(year)
        ? prev.filter((item) => item !== year)
        : [...prev, year],
    );
  };

  /*
   * =========================================================
   * 전체 선택 / 전체 해제
   * =========================================================
   */

  const toggleAllExcelInitials = () => {
    if (excelInitials.length === INITIALS.length) {
      setExcelInitials([]);
    } else {
      setExcelInitials([...INITIALS]);
    }
  };

  const toggleAllExcelCategories = () => {
    if (excelCategories.length === CATEGORY_OPTIONS.length) {
      setExcelCategories([]);
    } else {
      setExcelCategories([...CATEGORY_OPTIONS]);
    }
  };

  const toggleAllExcelYears = () => {
    if (excelYears.length === excelYearOptions.length) {
      setExcelYears([]);
    } else {
      setExcelYears([...excelYearOptions]);
    }
  };

  /*
   * =========================================================
   * 엑셀 다운로드
   * =========================================================
   */

  const downloadExcel = () => {
    const selectedFields = Object.keys(excelFields).filter(
      (key) => excelFields[key],
    );

    /*
     * 아무 항목도 선택하지 않은 경우
     */
    if (selectedFields.length === 0) {
      alert("엑셀로 받을 항목을 하나 이상 선택해 주세요.");

      return;
    }

    /*
     * 단어 선택 시 초성을 하나라도 선택해야 함
     */
    if (excelFields.word && excelInitials.length === 0) {
      alert("단어의 초성을 하나 이상 선택해 주세요.");

      return;
    }

    /*
     * 카테고리 선택 시 카테고리를 하나라도 선택해야 함
     */
    if (excelFields.category && excelCategories.length === 0) {
      alert("카테고리를 하나 이상 선택해 주세요.");

      return;
    }

    /*
     * 시대 선택 시 년도를 하나라도 선택해야 함
     */
    if (excelFields.era && excelYears.length === 0) {
      alert("시대를 하나 이상 선택해 주세요.");

      return;
    }

    /*
     * 현재 검색/필터 결과를 기준으로
     * 엑셀 세부 조건을 한 번 더 적용
     */
    const excelResult = result.filter((item) => {
      /*
       * 단어 → 초성
       */
      if (excelFields.word) {
        const itemInitial = getInitial(item.word);

        if (!excelInitials.includes(itemInitial)) {
          return false;
        }
      }

      /*
       * 카테고리
       */
      if (excelFields.category) {
        const itemCategory = item.category?.trim() || "기타";

        if (!excelCategories.includes(itemCategory)) {
          return false;
        }
      }

      /*
       * 시대 → 년도
       */
      if (excelFields.era) {
        const itemYear = getYear(item.era);

        if (!excelYears.includes(itemYear)) {
          return false;
        }
      }

      return true;
    });

    if (excelResult.length === 0) {
      alert("선택한 조건에 해당하는 신조어가 없습니다.");

      return;
    }

    /*
     * 엑셀 데이터 생성
     *
     * 좋아요 / 조회수 / 즐겨찾기는 포함하지 않음
     */
    const excelData = excelResult.map((item, index) => {
      const row = {
        번호: index + 1,
      };

      if (excelFields.word) {
        row["단어"] = item.word ?? "";
      }

      if (excelFields.meaning) {
        row["뜻"] = item.meaning ?? "";
      }

      if (excelFields.example) {
        row["예문"] = item.example ?? "";
      }

      if (excelFields.category) {
        row["카테고리"] = item.category?.trim() || "기타";
      }

      if (excelFields.era) {
        row["시대"] = item.era ?? "";
      }

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);

    /*
     * 선택한 항목에 따라 컬럼 너비 설정
     */
    const columnWidths = [];

    columnWidths.push({ wch: 8 });

    if (excelFields.word) {
      columnWidths.push({ wch: 20 });
    }

    if (excelFields.meaning) {
      columnWidths.push({ wch: 50 });
    }

    if (excelFields.example) {
      columnWidths.push({ wch: 60 });
    }

    if (excelFields.category) {
      columnWidths.push({ wch: 15 });
    }

    if (excelFields.era) {
      columnWidths.push({ wch: 15 });
    }

    worksheet["!cols"] = columnWidths;

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "신조어 사전");

    XLSX.writeFile(workbook, "신조어_사전.xlsx");

    /*
     * 다운로드 후 모달 닫기
     */
    setShowExcelModal(false);
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
          onClick={openExcelModal}
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

      {/* 년도 */}

      <div className="year-list">
        {years.map((year) => (
          <button
            key={year}
            type="button"
            className={
              selectedYear === year ? "year-button active" : "year-button"
            }
            onClick={() => changeYear(year)}
          >
            {year}
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
          selectedYear !== "전체" ||
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
        selectedYear !== "전체" ||
        showFavoritesOnly ||
        sortType !== "latest") && (
        <div className="filter-info">
          <span>현재 필터</span>

          {selectedCategory !== "전체" && <strong>{selectedCategory}</strong>}

          {selectedInitial !== "전체" && <strong>{selectedInitial}</strong>}

          {selectedYear !== "전체" && <strong>{selectedYear}</strong>}

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

      {/* =====================================================
          엑셀 다운로드 모달
      ===================================================== */}

      {showExcelModal && (
        <div className="excel-modal-overlay" onClick={closeExcelModal}>
          <div className="excel-modal" onClick={(e) => e.stopPropagation()}>
            <div className="excel-modal-header">
              <div>
                <h2>📥 엑셀 다운로드</h2>

                <p>다운로드할 항목과 세부 조건을 선택하세요.</p>
              </div>

              <button
                type="button"
                className="excel-modal-close"
                onClick={closeExcelModal}
              >
                ×
              </button>
            </div>

            <div className="excel-modal-body">
              {/* 항목 선택 */}

              <section className="excel-section">
                <h3>1. 다운로드 항목</h3>

                <div className="excel-field-list">
                  <label className="custom-checkbox">
                    <input
                      type="checkbox"
                      checked={excelFields.word}
                      onChange={() => toggleExcelField("word")}
                    />

                    <span className="checkbox-box">✓</span>

                    <span className="checkbox-text">단어</span>
                  </label>

                  <label className="custom-checkbox">
                    <input
                      type="checkbox"
                      checked={excelFields.meaning}
                      onChange={() => toggleExcelField("meaning")}
                    />

                    <span className="checkbox-box">✓</span>

                    <span className="checkbox-text">뜻</span>
                  </label>

                  <label className="custom-checkbox">
                    <input
                      type="checkbox"
                      checked={excelFields.example}
                      onChange={() => toggleExcelField("example")}
                    />

                    <span className="checkbox-box">✓</span>

                    <span className="checkbox-text">예문</span>
                  </label>

                  <label className="custom-checkbox">
                    <input
                      type="checkbox"
                      checked={excelFields.category}
                      onChange={() => toggleExcelField("category")}
                    />

                    <span className="checkbox-box">✓</span>

                    <span className="checkbox-text">카테고리</span>
                  </label>

                  <label className="custom-checkbox">
                    <input
                      type="checkbox"
                      checked={excelFields.era}
                      onChange={() => toggleExcelField("era")}
                    />

                    <span className="checkbox-box">✓</span>

                    <span className="checkbox-text">시대</span>
                  </label>
                </div>
              </section>

              {/* 단어 → 초성 */}

              {excelFields.word && (
                <section className="excel-detail-section">
                  <div className="excel-detail-header">
                    <h3>2. 단어 초성 선택</h3>

                    <button
                      type="button"
                      className="excel-select-all-button"
                      onClick={toggleAllExcelInitials}
                    >
                      {excelInitials.length === INITIALS.length
                        ? "전체 해제"
                        : "전체 선택"}
                    </button>
                  </div>

                  <div className="excel-option-grid initials-grid">
                    {INITIALS.map((initial) => (
                      <label key={initial} className="custom-checkbox small">
                        <input
                          type="checkbox"
                          checked={excelInitials.includes(initial)}
                          onChange={() => toggleExcelInitial(initial)}
                        />

                        <span className="checkbox-box">✓</span>

                        <span className="checkbox-text">{initial}</span>
                      </label>
                    ))}
                  </div>
                </section>
              )}

              {/* 카테고리 */}

              {excelFields.category && (
                <section className="excel-detail-section">
                  <div className="excel-detail-header">
                    <h3>3. 카테고리 선택</h3>

                    <button
                      type="button"
                      className="excel-select-all-button"
                      onClick={toggleAllExcelCategories}
                    >
                      {excelCategories.length === CATEGORY_OPTIONS.length
                        ? "전체 해제"
                        : "전체 선택"}
                    </button>
                  </div>

                  <div className="excel-option-grid">
                    {CATEGORY_OPTIONS.map((category) => (
                      <label key={category} className="custom-checkbox">
                        <input
                          type="checkbox"
                          checked={excelCategories.includes(category)}
                          onChange={() => toggleExcelCategory(category)}
                        />

                        <span className="checkbox-box">✓</span>

                        <span className="checkbox-text">{category}</span>
                      </label>
                    ))}
                  </div>
                </section>
              )}

              {/* 시대 → 년도 */}

              {excelFields.era && (
                <section className="excel-detail-section">
                  <div className="excel-detail-header">
                    <h3>4. 시대 / 년도 선택</h3>

                    <button
                      type="button"
                      className="excel-select-all-button"
                      onClick={toggleAllExcelYears}
                    >
                      {excelYears.length === excelYearOptions.length
                        ? "전체 해제"
                        : "전체 선택"}
                    </button>
                  </div>

                  {excelYearOptions.length > 0 ? (
                    <div className="excel-option-grid">
                      {excelYearOptions.map((year) => (
                        <label key={year} className="custom-checkbox">
                          <input
                            type="checkbox"
                            checked={excelYears.includes(year)}
                            onChange={() => toggleExcelYear(year)}
                          />

                          <span className="checkbox-box">✓</span>

                          <span className="checkbox-text">{year}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="excel-empty">
                      등록된 년도 데이터가 없습니다.
                    </p>
                  )}
                </section>
              )}

              <div className="excel-notice">
                <span>ℹ️</span>
                <p>
                  좋아요, 조회수, 즐겨찾기 정보는 엑셀 파일에 포함되지 않습니다.
                </p>
              </div>
            </div>

            <div className="excel-modal-footer">
              <button
                type="button"
                className="excel-cancel-button"
                onClick={closeExcelModal}
              >
                취소
              </button>

              <button
                type="button"
                className="excel-confirm-button"
                onClick={downloadExcel}
              >
                📥 엑셀 다운로드
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dictionary;
