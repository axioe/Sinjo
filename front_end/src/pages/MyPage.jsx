import { useAuth } from "../AuthContext";
import { useState } from "react";
import MyPageSidebar from "../components/MyPage/MyPageSidebar";
import ProfileCard from "../components/MyPage/ProfileCard";
import RecentTranslations from "../components/MyPage/RecentTranslations";
import QuickMenu from "../components/MyPage/QuickMenu";
import ActivitySummary from "../components/MyPage/ActivitySummary";
import BadgePoints from "../components/MyPage/BadgePoints";
import WeeklyRecord from "../components/MyPage/WeeklyRecord";
import {
  RECENT_TRANSLATIONS,
  ACTIVITY_SUMMARY,
  BADGES,
  POINT_BALANCE,
  WEEKLY_RECORD,
} from "../data/myPageSampleData";
import "../css/MyPage.css";

/**
 * 마이페이지 (REQ-AUTH-02, REQ-MY-01)
 * 화면구조 가이드라인 6장: 변환 이력 / 즐겨찾기 / 테스트·게임 결과 / 계정 설정
 *
 * 프로필은 서버에서 받은 실제 회원 정보를 쓴다.
 * 나머지 카드는 아직 서버 API 가 없어 샘플 데이터를 쓴다.
 * 즐겨찾기 토글과 삭제는 화면에서 즉시 반영되지만 새로고침하면 되돌아간다.
 *
 * [수정 1] 모듈 최상단에 있던 console.log("BADGES =", BADGES) 를 지웠다.
 *   디버그용 코드가 남아 있으면 배포 후에도 사용자 콘솔에 계속 찍힌다.
 * [수정 2] 쓰지 않는 USER_PROFILE import 를 지웠다. (npm run lint 실패 원인)
 */
function MyPage() {
  const { user } = useAuth();
  const [activeMenu, setActiveMenu] = useState("home");
  const [translations, setTranslations] = useState(RECENT_TRANSLATIONS);

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
        <ProfileCard profile={user} />
        <RecentTranslations
          items={translations}
          onToggleFavorite={handleToggleFavorite}
          onDelete={handleDelete}
        />
        <QuickMenu />
      </div>

      <div className="mypage-side">
        <ActivitySummary items={ACTIVITY_SUMMARY} />
        <BadgePoints badges={BADGES} point={POINT_BALANCE} />
        <WeeklyRecord records={WEEKLY_RECORD} />
      </div>
    </div>
  );
}

export default MyPage;
