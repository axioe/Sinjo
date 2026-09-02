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

import ProfileEdit from "../../components/MyPage/ProfileEdit";

const MENU = {
  HOME: "home",
  PROFILE: "profile",
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
  };

  /*
   * 번역 기록 삭제
   */
  const handleDelete = (id) => {
    if (!window.confirm("이 번역 기록을 삭제할까요?")) {
      return;
    }

    const removeTranslation = (prev) => prev.filter((item) => item.id !== id);

    setTranslations(removeTranslation);
    setAllTranslations(removeTranslation);

    setTranslationCount((prev) =>
      prev == null ? prev : Math.max(0, prev - 1),
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

      setFavorites((prev) => prev.filter((item) => item.wordId !== wordId));

      setFavoriteCount((prev) => (prev == null ? prev : Math.max(0, prev - 1)));
    } catch (error) {
      console.error("즐겨찾기 삭제 실패:", error);

      window.alert("즐겨찾기 해제에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const renderContent = () => {
    switch (activeMenu) {
      case MENU.HOME:
        return (
          <>
            <ProfileCard
              profile={user}
            />

            <RecentTranslations
              items={translations}
              loading={loading.home}
              onToggleFavorite={handleToggleFavorite}
              onDelete={handleDelete}
            />

            <QuickMenu />
          </>
        );

      case MENU.PROFILE:
        return (
          <section className="mypage-content-section">
            <PageHeader
              eyebrow="ACCOUNT"
              title="유저 정보 변경"
              description="닉네임과 비밀번호를 변경할 수 있어요."
            />

            <ProfileEdit onChangePassword={() => setShowPasswordModal(true)} />
          </section>
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

            <GameHistory items={gameHistory} loading={loading.game} />
          </section>
        );

      default:
        return <ComingSoon />;
    }
  };

  return (
    <>
      <div className="mypage">
        <MyPageSidebar active={activeMenu} onSelect={setActiveMenu} />

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
            <main className="mypage-main">{renderContent()}</main>

            <aside className="mypage-side">
              <ActivitySummary items={activityItems} />

              <BadgePoints
                badges={badges}
                point={pointBalance ?? 0}
                onViewAll={() => setActiveMenu(MENU.STATS)}
              />

              <WeeklyRecord
                activeDates={attendanceDateSet}
                onViewAll={() => setActiveMenu(MENU.STATS)}
              />
            </aside>
          </>
        )}
      </div>

      {showPasswordModal && (
        <PasswordChangeModal onClose={() => setShowPasswordModal(false)} />
      )}
    </>
  );
}

/*
 * 공통 페이지 헤더
 */
function PageHeader({ eyebrow, title, description }) {
  return (
    <header className="mypage-section-header">
      <div>
        <span className="mypage-section-eyebrow">{eyebrow}</span>

        <h1>{title}</h1>

        <p>{description}</p>
      </div>
    </header>
  );
}

/*
 * 준비 중 화면
 */
function ComingSoon() {
  return (
    <section className="mypage-card mypage-coming-soon">
      <div className="mypage-coming-soon-icon">🚧</div>

      <h2>준비 중이다.</h2>

      <p>명령하지 마라.</p>
    </section>
  );
}

export default MyPage;
