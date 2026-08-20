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

export const ACTIVITY_SUMMARY = [
  { key: "saved", label: "저장한 번역", value: 128, diff: 12, tone: "purple" },
  { key: "favorite", label: "즐겨찾기 단어", value: 32, diff: 6, tone: "mint" },
  { key: "game", label: "게임 플레이", value: 18, diff: 3, tone: "amber" },
  { key: "test", label: "테스트 완료", value: 56, diff: 9, tone: "pink" },
];

export const BADGES = [
  { key: "explorer", name: "신조어 탐험가", desc: "100개 단어 학습", current: 71, goal: 100, tone: "purple" },
  { key: "master", name: "번역 마스터", desc: "50번 번역 저장", current: 32, goal: 50, tone: "mint" },
  { key: "player", name: "게임 고수", desc: "20회 게임 플레이", current: 18, goal: 20, tone: "pink" },
];

export const POINT_BALANCE = 1250;

/** 이번 주 사용 기록. 월요일부터 순서대로. */
export const WEEKLY_RECORD = [
  { day: "월", used: true },
  { day: "화", used: true },
  { day: "수", used: true },
  { day: "목", used: true },
  { day: "금", used: true },
  { day: "토", used: false },
  { day: "일", used: false },
];
