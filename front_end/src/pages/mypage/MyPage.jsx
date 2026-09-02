import "../../css/mypage/MyPage.css";
import { useAuth } from "../../AuthContext";
import { useEffect, useMemo, useState } from "react";

import MyPageSidebar from "../../components/MyPage/MyPageSidebar";
import ProfileCard from "../../components/MyPage/ProfileCard";
import RecentTranslations from "../../components/MyPage/RecentTranslations";
import QuickMenu from "../../components/MyPage/QuickMenu";
import ActivitySummary from "../../components/MyPage/ActivitySummary";
import BadgePoints from "../../components/MyPage/BadgePoints";
import WeeklyRecord from "../../components/MyPage/WeeklyRecord";
import ActivityStatsPanel from "../../components/MyPage/ActivityStatsPanel";
import GameHistory from "../../components/MyPage/GameHistory";
import FavoriteWords from "../../components/MyPage/FavoriteWords";
import PasswordChangeModal from "../../components/MyPage/PasswordChangeModal";

import { ACTIVITY_SUMMARY_PLACEHOLDERS } from "../../data/myPageSampleData";

import { getMyQuizStats, getMyGameHistory } from "../../api/quizApi";
import { getMyAttendance } from "../../api/attendanceApi";
import { getMyPoints } from "../../api/pointApi";

import {
  getMyTranslations,
  getMyTranslationCount,
} from "../../api/translateApi";

import {
  getMyFavorites,
  getMyFavoriteCount,
  removeFavorite,
} from "../../api/favoriteApi";

const MENU = {
  HOME: "home",
  SAVED: "saved",
  FAVORITE: "favorite",
  GAME: "game",
  STATS: "stats",
};

function MyPage() {
  const { user } = useAuth();

  const [activeMenu, setActiveMenu] = useState(MENU.HOME);

  const [translations, setTranslations] = useState([]);
  const [allTranslations, setAllTranslations] = useState([]);
  const [translationCount, setTranslationCount] = useState(null);

  const [favorites, setFavorites] = useState([]);
  const [favoriteCount, setFavoriteCount] = useState(null);

  const [gameHistory, setGameHistory] = useState([]);
  const [gameStats, setGameStats] = useState(null);

  const [attendanceDates, setAttendanceDates] = useState(null);

  const [pointBalance, setPointBalance] = useState(null);

  const [loading, setLoading] = useState({
    home: true,
    saved: false,
    favorite: false,
    game: false,
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);

  /*
   * 번역 상세 모달
   *
   * 선택한 번역 기록을 저장한다.
   * null이면 모달을 닫은 상태다.
   */
  const [selectedTranslation, setSelectedTranslation] = useState(null);

  /*
   * 기본 마이페이지 데이터
   */
  useEffect(() => {
    let alive = true;

    const loadHomeData = async () => {
      try {
        const [
          stats,
          recentTranslations,
          translationsCount,
          favoritesCount,
          attendance,
          points,
        ] = await Promise.all([
          getMyQuizStats(),
          getMyTranslations(0, 5),
          getMyTranslationCount(),
          getMyFavoriteCount(),
          getMyAttendance(),
          getMyPoints(),
        ]);

        if (!alive) return;

        setGameStats(stats);
        setTranslations(recentTranslations ?? []);
        setTranslationCount(translationsCount);
        setFavoriteCount(favoritesCount);
        setAttendanceDates(attendance ?? []);
        setPointBalance(points?.balance ?? 0);
      } catch (error) {
        console.error("마이페이지 기본 데이터 조회 실패:", error);
      } finally {
        if (alive) {
          setLoading((prev) => ({
            ...prev,
            home: false,
          }));
        }
      }
    };

    loadHomeData();

    return () => {
      alive = false;
    };
  }, []);

  /*
   * 메뉴별 데이터 조회
   */
  useEffect(() => {
    let alive = true;

    const loadMenuData = async () => {
      if (activeMenu === MENU.FAVORITE && favorites.length === 0) {
        setLoading((prev) => ({
          ...prev,
          favorite: true,
        }));

        try {
          const list = await getMyFavorites(0, 50);

          if (alive) {
            setFavorites(list ?? []);
          }
        } catch (error) {
          console.error("즐겨찾기 조회 실패:", error);
        } finally {
          if (alive) {
            setLoading((prev) => ({
              ...prev,
              favorite: false,
            }));
          }
        }
      }

      if (activeMenu === MENU.SAVED && allTranslations.length === 0) {
        setLoading((prev) => ({
          ...prev,
          saved: true,
        }));

        try {
          const list = await getMyTranslations(0, 50);

          if (alive) {
            setAllTranslations(list ?? []);
          }
        } catch (error) {
          console.error("저장된 번역 조회 실패:", error);
        } finally {
          if (alive) {
            setLoading((prev) => ({
              ...prev,
              saved: false,
            }));
          }
        }
      }

      if (activeMenu === MENU.GAME && gameHistory.length === 0) {
        setLoading((prev) => ({
          ...prev,
          game: true,
        }));

        try {
          const list = await getMyGameHistory(0, 50);

          if (alive) {
            setGameHistory(list ?? []);
          }
        } catch (error) {
          console.error("게임 기록 조회 실패:", error);
        } finally {
          if (alive) {
            setLoading((prev) => ({
              ...prev,
              game: false,
            }));
          }
        }
      }
    };

    loadMenuData();

    return () => {
      alive = false;
    };
  }, [
    activeMenu,
    favorites.length,
    allTranslations.length,
    gameHistory.length,
  ]);

  /*
   * 활동 요약
   */
  const activityItems = useMemo(
    () => [
      {
        ...ACTIVITY_SUMMARY_PLACEHOLDERS[0],
        ready: translationCount !== null,
        value: translationCount ?? 0,
        diff: 0,
      },
      {
        ...ACTIVITY_SUMMARY_PLACEHOLDERS[1],
        ready: favoriteCount !== null,
        value: favoriteCount ?? 0,
        diff: 0,
      },
      {
        key: "game",
        label: "게임 플레이",
        tone: "amber",
        ready: gameStats !== null,
        value: gameStats?.totalPlays ?? 0,
        diff: gameStats?.playsThisMonth ?? 0,
      },
      {
        ...ACTIVITY_SUMMARY_PLACEHOLDERS[2],
        ready: false,
        value: 0,
        diff: 0,
      },
    ],
    [translationCount, favoriteCount, gameStats],
  );

  /*
   * 배지
   */
  const badges = useMemo(
    () => [
      {
        key: "translate",
        name: "단어 번역",
        desc: "번역 50회 달성",
        current: translationCount ?? 0,
        goal: 50,
        tone: "purple",
      },
      {
        key: "game",
        name: "게임 플레이",
        desc: "게임 20회 플레이",
        current: gameStats?.totalPlays ?? 0,
        goal: 20,
        tone: "mint",
      },
      {
        key: "board",
        name: "게시판 이용",
        desc: "게시판 기능 준비 중",
        tone: "pink",
        prototype: true,
      },
    ],
    [translationCount, gameStats],
  );

  const attendanceDateSet = useMemo(
    () => new Set(attendanceDates ?? []),
    [attendanceDates],
  );

  const isStats = activeMenu === MENU.STATS;

  /*
   * 번역 기록 클릭
   */
  const handleTranslationClick = (translation) => {
    setSelectedTranslation(translation);
  };

  /*
   * 번역 상세 모달 닫기
   */
  const handleCloseTranslationDetail = () => {
    setSelectedTranslation(null);
  };

  /*
   * ESC로 상세 모달 닫기
   */
  useEffect(() => {
    if (!selectedTranslation) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedTranslation(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedTranslation]);

  /*
   * 번역 즐겨찾기
   */
  const handleToggleFavorite = (id) => {
    const toggleFavorite = (prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              favorite: !item.favorite,
            }
          : item,
      );

    setTranslations(toggleFavorite);
    setAllTranslations(toggleFavorite);

    /*
     * 현재 상세 모달에 열린 번역도 즉시 반영
     */
    setSelectedTranslation((prev) => {
      if (!prev || prev.id !== id) return prev;

      return {
        ...prev,
        favorite: !prev.favorite,
      };
    });
  };

  /*
   * 번역 기록 삭제
   */
  const handleDelete = (id) => {
    if (!window.confirm("이 번역 기록을 삭제할까요?")) {
      return;
    }

    const removeTranslation = (prev) =>
      prev.filter((item) => item.id !== id);

    setTranslations(removeTranslation);
    setAllTranslations(removeTranslation);

    setTranslationCount((prev) =>
      prev == null ? prev : Math.max(0, prev - 1),
    );

    /*
     * 삭제된 기록이 상세 모달에 열려 있었다면 닫는다.
     */
    setSelectedTranslation((prev) =>
      prev?.id === id ? null : prev,
    );
  };

  /*
   * 즐겨찾기 삭제
   */
  const handleRemoveFavorite = async (wordId) => {
    if (!window.confirm("즐겨찾기를 해제할까요?")) {
      return;
    }

    try {
      await removeFavorite(wordId);

      setFavorites((prev) =>
        prev.filter((item) => item.wordId !== wordId),
      );

      setFavoriteCount((prev) =>
        prev == null ? prev : Math.max(0, prev - 1),
      );
    } catch (error) {
      console.error("즐겨찾기 삭제 실패:", error);

      window.alert(
        "즐겨찾기 해제에 실패했습니다. 다시 시도해주세요.",
      );
    }
  };

  const renderContent = () => {
    switch (activeMenu) {
      case MENU.HOME:
        return (
          <>
            <ProfileCard
              profile={user}
              onChangePassword={() =>
                setShowPasswordModal(true)
              }
            />

            <RecentTranslations
              items={translations}
              loading={loading.home}
              onToggleFavorite={handleToggleFavorite}
              onDelete={handleDelete}
              onItemClick={handleTranslationClick}
            />

            <QuickMenu />
          </>
        );

      case MENU.SAVED:
        return (
          <section className="mypage-content-section">
            <PageHeader
              eyebrow="SAVED TRANSLATIONS"
              title="번역 저장"
              description="내가 저장한 번역 기록을 확인할 수 있어요."
            />

            <RecentTranslations
              items={allTranslations}
              loading={loading.saved}
              onToggleFavorite={handleToggleFavorite}
              onDelete={handleDelete}
              onItemClick={handleTranslationClick}
            />
          </section>
        );

      case MENU.FAVORITE:
        return (
          <section className="mypage-content-section">
            <PageHeader
              eyebrow="FAVORITE WORDS"
              title="즐겨찾기 단어"
              description="자주 보고 싶은 단어를 한곳에서 관리하세요."
            />

            <FavoriteWords
              items={favorites}
              loading={loading.favorite}
              onRemove={handleRemoveFavorite}
            />
          </section>
        );

      case MENU.GAME:
        return (
          <section className="mypage-content-section">
            <PageHeader
              eyebrow="GAME HISTORY"
              title="게임 기록"
              description="지금까지 플레이한 게임 기록을 확인하세요."
            />

            <GameHistory
              items={gameHistory}
              loading={loading.game}
            />
          </section>
        );

      default:
        return <ComingSoon />;
    }
  };

  return (
    <>
      <div className="mypage">
        <MyPageSidebar
          active={activeMenu}
          onSelect={setActiveMenu}
        />

        {isStats ? (
          <main className="mypage-main mypage-main-wide">
            <ActivityStatsPanel
              activeDates={attendanceDateSet}
              activityItems={activityItems}
              badges={badges}
            />
          </main>
        ) : (
          <>
            <main className="mypage-main">
              {renderContent()}
            </main>

            <aside className="mypage-side">
              <ActivitySummary items={activityItems} />

              <BadgePoints
                badges={badges}
                point={pointBalance ?? 0}
                onViewAll={() =>
                  setActiveMenu(MENU.STATS)
                }
              />

              <WeeklyRecord
                activeDates={attendanceDateSet}
                onViewAll={() =>
                  setActiveMenu(MENU.STATS)
                }
              />
            </aside>
          </>
        )}
      </div>

      {showPasswordModal && (
        <PasswordChangeModal
          onClose={() => setShowPasswordModal(false)}
        />
      )}

      {selectedTranslation && (
        <TranslationDetailModal
          translation={selectedTranslation}
          onClose={handleCloseTranslationDetail}
          onToggleFavorite={handleToggleFavorite}
        />
      )}
    </>
  );
}

/*
 * 공통 페이지 헤더
 */
function PageHeader({
  eyebrow,
  title,
  description,
}) {
  return (
    <header className="mypage-section-header">
      <div>
        <span className="mypage-section-eyebrow">
          {eyebrow}
        </span>

        <h1>{title}</h1>

        <p>{description}</p>
      </div>
    </header>
  );
}

/*
 * 번역 상세 모달
 */
function TranslationDetailModal({
  translation,
  onClose,
  onToggleFavorite,
}) {
  const source =
    translation.sourceText ??
    translation.source ??
    translation.text ??
    translation.word ??
    "";

  const result =
    translation.translatedText ??
    translation.result ??
    translation.translation ??
    "";

  const language =
    translation.language ??
    translation.targetLanguage ??
    translation.lang ??
    null;

  const createdAt =
    translation.createdAt ??
    translation.createdDate ??
    translation.date ??
    translation.createdAtText ??
    null;

  const isFavorite =
    translation.favorite ??
    translation.isFavorite ??
    false;

  const formatDate = (value) => {
    if (!value) return "날짜 정보 없음";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className="translation-detail-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="translation-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="translation-detail-title"
      >
        <div className="translation-detail-header">
          <div>
            <span className="translation-detail-eyebrow">
              TRANSLATION DETAIL
            </span>

            <h2 id="translation-detail-title">
              번역 기록
            </h2>
          </div>

          <button
            type="button"
            className="translation-detail-close"
            onClick={onClose}
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <div className="translation-detail-body">
          <div className="translation-detail-meta">
            <span className="translation-detail-tag">
              {language || "TRANSLATION"}
            </span>

            <span className="translation-detail-date">
              {formatDate(createdAt)}
            </span>
          </div>

          <div className="translation-detail-box source">
            <div className="translation-detail-label">
              원문
            </div>

            <p>{source || "원문이 없습니다."}</p>
          </div>

          <div className="translation-detail-arrow">
            ↓
          </div>

          <div className="translation-detail-box result">
            <div className="translation-detail-label">
              번역 결과
            </div>

            <p>{result || "번역 결과가 없습니다."}</p>
          </div>

          <div className="translation-detail-actions">
            <button
              type="button"
              className={`translation-detail-favorite ${
                isFavorite ? "on" : ""
              }`}
              onClick={() => {
                if (translation.id != null) {
                  onToggleFavorite(translation.id);
                }
              }}
            >
              <span>{isFavorite ? "★" : "☆"}</span>
              {isFavorite
                ? "즐겨찾기 해제"
                : "즐겨찾기 추가"}
            </button>

            <button
              type="button"
              className="translation-detail-confirm"
              onClick={onClose}
            >
              확인
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

/*
 * 준비 중 화면
 */
function ComingSoon() {
  return (
    <section className="mypage-card mypage-coming-soon">
      <div className="mypage-coming-soon-icon">
        🚧
      </div>

      <h2>준비 중입니다.</h2>

      <p>
        해당 기능은 현재 준비하고 있어요.
      </p>
    </section>
  );
}

export default MyPage;
