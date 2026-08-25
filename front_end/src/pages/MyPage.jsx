import { useAuth } from "../AuthContext";
import { useState, useEffect } from "react";
import MyPageSidebar from "../components/MyPage/MyPageSidebar";
import ProfileCard from "../components/MyPage/ProfileCard";
import RecentTranslations from "../components/MyPage/RecentTranslations";
import QuickMenu from "../components/MyPage/QuickMenu";
import ActivitySummary from "../components/MyPage/ActivitySummary";
import BadgePoints from "../components/MyPage/BadgePoints";
import WeeklyRecord from "../components/MyPage/WeeklyRecord";
import {
  RECENT_TRANSLATIONS,
  ACTIVITY_SUMMARY_PLACEHOLDERS,
  BADGES,
  POINT_BALANCE,
} from "../data/myPageSampleData";
import { getMyQuizStats } from "../api/quizApi";
import PasswordChangeModal from "../components/MyPage/PasswordChangeModal";
import "../css/MyPage.css";

/**
 * 마이페이지 (REQ-AUTH-02, REQ-MY-01)
 * 화면구조 가이드라인 6장: 변환 이력 / 즐겨찾기 / 테스트·게임 결과 / 계정 설정
 *
 * 프로필은 서버에서 받은 실제 회원 정보를 쓴다.
 * 활동 요약의 "게임 플레이" 카드는 QuizAttempt 기반 실데이터고(quizApi.getMyQuizStats),
 * "이번 주 사용 기록"(전체 보기 달력 포함)은 로그인 출석 기반 실데이터다
 * (attendanceApi.getMyAttendance - 로그인 성공 시 서버가 자동 기록한다).
 * 그 외 카드(저장한 번역/즐겨찾기/테스트, 배지)는 아직 서버 API 가 없어
 * 샘플 데이터거나 "준비 중" 상태다 - 해당 기능을 만드는 사람이 채워 넣을 자리다.
 * 즐겨찾기 토글과 삭제는 화면에서 즉시 반영되지만 새로고침하면 되돌아간다.
 *
 * [수정 1] 모듈 최상단에 있던 console.log("BADGES =", BADGES) 를 지웠다.
 *   디버그용 코드가 남아 있으면 배포 후에도 사용자 콘솔에 계속 찍힌다.
 * [수정 2] 쓰지 않는 USER_PROFILE import 를 지웠다. (npm run lint 실패 원인)
 * [수정 3] 비밀번호 변경 모달을 추가했다. ProfileCard 의 버튼으로 연다.
 */
function MyPage() {
  const { user } = useAuth();
  const [activeMenu, setActiveMenu] = useState("home");
  const [translations, setTranslations] = useState(RECENT_TRANSLATIONS);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [gameStats, setGameStats] = useState(null); // null: 아직 못 불러옴 → "준비 중"으로 표시

  useEffect(() => {
    let alive = true;

    getMyQuizStats().then((stats) => {
      if (alive) setGameStats(stats);
    });

    return () => {
      alive = false;
    };
  }, []);

  // 원래 카드 순서(저장한 번역 / 즐겨찾기 / 게임 플레이 / 테스트 완료)를 그대로 유지한다.
  const activityItems = [
    { ...ACTIVITY_SUMMARY_PLACEHOLDERS[0], ready: false },
    { ...ACTIVITY_SUMMARY_PLACEHOLDERS[1], ready: false },
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

  const handleToggleFavorite = (id) => {
    // TODO: 서버 연동 시 즐겨찾기 저장/해제 요청을 보낸다.
    setTranslations((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, favorite: !item.favorite } : item
      )
    );
  };

  const handleDelete = (id) => {
    if (!window.confirm("이 번역 기록을 삭제할까요?")) return;

    // TODO: 서버 연동 시 삭제 요청을 보낸다.
    setTranslations((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="mypage">
      <MyPageSidebar active={activeMenu} onSelect={setActiveMenu} />

      <div className="mypage-main">
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
      </div>

      <div className="mypage-side">
        <ActivitySummary items={activityItems} />
        <BadgePoints badges={BADGES} point={POINT_BALANCE} />
        <WeeklyRecord activityItems={activityItems} />
      </div>

      {showPasswordModal && (
        <PasswordChangeModal onClose={() => setShowPasswordModal(false)} />
      )}
    </div>
  );
}

export default MyPage;