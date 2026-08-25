import "../css/MyPage.css";
import { useAuth } from "../AuthContext";
import { useState, useEffect } from "react";
import MyPageSidebar from "../components/MyPage/MyPageSidebar";
import ProfileCard from "../components/MyPage/ProfileCard";
import RecentTranslations from "../components/MyPage/RecentTranslations";
import QuickMenu from "../components/MyPage/QuickMenu";
import ActivitySummary from "../components/MyPage/ActivitySummary";
import BadgePoints from "../components/MyPage/BadgePoints";
import WeeklyRecord from "../components/MyPage/WeeklyRecord";
import ActivityStatsPanel from "../components/MyPage/ActivityStatsPanel";
import {
  ACTIVITY_SUMMARY_PLACEHOLDERS,
  BADGES,
  POINT_BALANCE,
} from "../data/myPageSampleData";
import { getMyQuizStats } from "../api/quizApi";
import { getMyAttendance } from "../api/attendanceApi";
import PasswordChangeModal from "../components/MyPage/PasswordChangeModal";
import { getMyTranslations, getMyTranslationCount } from "../api/translateApi";
import FavoriteWords from "../components/MyPage/FavoriteWords";
import {
  getMyFavorites,
  getMyFavoriteCount,
  removeFavorite,
} from "../api/favoriteApi";

/**
 * 마이페이지 (REQ-AUTH-02, REQ-MY-01)
 * 화면구조 가이드라인 6장: 변환 이력 / 즐겨찾기 / 테스트·게임 결과 / 계정 설정
 *
 * 프로필은 서버에서 받은 실제 회원 정보를 쓴다.
 * 활동 요약의 "게임 플레이" 카드는 QuizAttempt 기반 실데이터다(quizApi.getMyQuizStats).
 * "저장한 번역" 카드는 translations 테이블 기준 실데이터다.
 * 나머지 카드(즐겨찾기/테스트, 배지, 이번 주 기록)는 아직 서버 API 가 없어
 * 샘플 데이터거나 "준비 중" 상태다 - 해당 기능을 만드는 사람이 채워 넣을 자리다.
 *
 * 사이드바 "번역 저장"(key: saved)을 누르면 본문이 전체 번역 목록으로 바뀐다.
 * 그 밖의 메뉴는 아직 화면이 없어 "준비 중"만 보여준다.
 */
function MyPage() {
  const { user } = useAuth();
  const [activeMenu, setActiveMenu] = useState("home");
  const [translations, setTranslations] = useState([]);
  const [translationCount, setTranslationCount] = useState(null);
  const [allTranslations, setAllTranslations] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [favoriteCount, setFavoriteCount] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [gameStats, setGameStats] = useState(null); // null: 아직 못 불러옴 → "준비 중"으로 표시
  const [attendanceDates, setAttendanceDates] = useState(null); // null: 아직 못 불러옴 → 출석 표시 없음

  useEffect(() => {
    let alive = true;

    getMyQuizStats().then((stats) => {
      if (alive) setGameStats(stats);
    });

    getMyTranslations(0, 5)
      .then((list) => {
        if (alive) setTranslations(list);
      })
      .catch(console.error);

    getMyTranslationCount()
      .then((count) => {
        if (alive) setTranslationCount(count);
      })
      .catch(console.error);

    getMyFavoriteCount()
      .then((count) => {
        if (alive) setFavoriteCount(count);
      })
      .catch(console.error);

    return () => {
      alive = false;
    };
  }, []);

  // "즐겨찾기 단어" 메뉴를 열 때만 목록을 불러온다.
  useEffect(() => {
    if (activeMenu !== "favorite") return;

    let alive = true;

    getMyFavorites(0, 50)
      .then((list) => {
        if (alive) setFavorites(list);
      })
      .catch(console.error);

    return () => {
      alive = false;
    };
  }, [activeMenu]);

  // "번역 저장" 메뉴를 열 때만 전체 목록을 불러온다.
  useEffect(() => {
    if (activeMenu !== "saved") return;

    let alive = true;

    getMyTranslations(0, 50)
      .then((list) => {
        if (alive) setAllTranslations(list);
      })
      .catch(console.error);

    return () => {
      alive = false;
    };
  }, [activeMenu]);

  // 원래 카드 순서(저장한 번역 / 즐겨찾기 / 게임 플레이 / 테스트 완료)를 그대로 유지한다.
  const activityItems = [
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
    { ...ACTIVITY_SUMMARY_PLACEHOLDERS[2], ready: false },
  ];

  const attendanceDateSet = new Set(attendanceDates ?? []);
  const isStats = activeMenu === "stats";

  const handleToggleFavorite = (id) => {
    // TODO: 서버 연동 시 즐겨찾기 저장/해제 요청을 보낸다.
    const toggle = (prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, favorite: !item.favorite } : item,
      );

    setTranslations(toggle);
    setAllTranslations(toggle);
  };

  const handleDelete = (id) => {
    if (!window.confirm("이 번역 기록을 삭제할까요?")) return;

    // TODO: 서버 연동 시 삭제 요청을 보낸다.
    const remove = (prev) => prev.filter((item) => item.id !== id);

    setTranslations(remove);
    setAllTranslations(remove);
  };

  const handleRemoveFavorite = async (wordId) => {
    if (!window.confirm("즐겨찾기를 해제할까요?")) return;

    try {
      await removeFavorite(wordId);
      setFavorites((prev) => prev.filter((item) => item.wordId !== wordId));
      setFavoriteCount((prev) => (prev == null ? prev : prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="mypage">
      <MyPageSidebar active={activeMenu} onSelect={setActiveMenu} />

      {isStats ? (
        <div className="mypage-main mypage-main-wide">
          <ActivityStatsPanel
            activeDates={attendanceDateSet}
            activityItems={activityItems}
          />
        </div>
      ) : (
        <>
          <div className="mypage-main">
            {activeMenu === "home" && (
              <>
                <ProfileCard
                  profile={user}
                  onChangePassword={() => setShowPasswordModal(true)}
                />
                <RecentTranslations
                  items={translations}
                  onToggleFavorite={handleToggleFavorite}
                  onDelete={handleDelete}
                />
                <QuickMenu />
              </>
            )}

            {activeMenu === "saved" && (
              <RecentTranslations
                items={allTranslations}
                onToggleFavorite={handleToggleFavorite}
                onDelete={handleDelete}
              />
            )}

            {activeMenu !== "home" &&
              activeMenu !== "saved" &&
              activeMenu !== "favorite" && (
                <section className="mypage-card">
                  <p className="mypage-empty">준비 중입니다.</p>
                </section>
              )}

            {activeMenu === "favorite" && (
              <FavoriteWords
                items={favorites}
                onRemove={handleRemoveFavorite}
              />
            )}
          </div>

          <div className="mypage-side">
            <ActivitySummary items={activityItems} />
            <BadgePoints badges={BADGES} point={POINT_BALANCE} />
            <WeeklyRecord
              activeDates={attendanceDateSet}
              onViewAll={() => setActiveMenu("stats")}
            />
          </div>
        </>
      )}

      {showPasswordModal && (
        <PasswordChangeModal onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
}

export default MyPage;
