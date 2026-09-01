/**
 * 마이페이지 샘플 데이터 (REQ-AUTH-02, REQ-MY-01)
 * 서버 연동 전까지 화면을 확인하기 위한 값이다.
 * 백엔드가 붙으면 이 파일을 지우고 API 응답으로 교체한다.
 */

export const USER_PROFILE = {
  nickname: "신세대러",
  joinedAt: "2026.03.15",
  lastLoginAt: "2026.05.20 14:30",
};

export const RECENT_TRANSLATIONS = [
  {
    id: 1,
    source: "오늘 완전 럭키비키잖아~",
    result: "오늘 완전 운이 좋잖아~",
    createdAt: "2026.05.20 14:32",
    favorite: false,
  },
  {
    id: 2,
    source: "억까 당해서 현타 옴;;",
    result: "별다른 이유 없이 억지로 까여서 허탈함;;",
    createdAt: "2026.05.20 13:15",
    favorite: true,
  },
  {
    id: 3,
    source: "이거 레전드야, 진짜 GOAT임",
    result: "이거 정말 대단해, 최고야.",
    createdAt: "2026.05.19 22:08",
    favorite: false,
  },
  {
    id: 4,
    source: "긁?",
    result: "긁혔어?",
    createdAt: "2026.05.19 18:45",
    favorite: false,
  },
  {
    id: 5,
    source: "중꺾마",
    result: "중요한 건 꺾이지 않는 마음이다.",
    createdAt: "2026.05.19 09:12",
    favorite: false,
  },
];

/**
 * 활동 요약 카드 중 아직 백엔드 기능이 없는 항목들.
 * value/diff 없이 label/tone 만 있다 - ActivitySummary 가 ready:false 로 렌더링해
 * "준비 중"으로 보여준다. 번역 저장, 즐겨찾기 기능을 만들 사람은 여기에 value/diff 를
 * 채우고 MyPage.jsx 에서 ready:true 로 바꾸면 된다.
 *
 * "game"(게임 플레이)은 QuizAttempt 로 실데이터가 연동돼 있어 여기 없다 - MyPage.jsx 참고.
 */
export const ACTIVITY_SUMMARY_PLACEHOLDERS = [
  { key: "saved", label: "저장한 번역", tone: "purple" },
  { key: "favorite", label: "즐겨찾기 단어", tone: "mint" },
  { key: "test", label: "테스트 완료", tone: "pink" },
];

export const POINT_BALANCE = 1250;
