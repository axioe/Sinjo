/**
 * 마이페이지 샘플 데이터 (REQ-AUTH-02, REQ-MY-01)
 * ACTIVITY_SUMMARY_PLACEHOLDERS 만 남아 있다 - USER_PROFILE/RECENT_TRANSLATIONS
 * 는 실제 API 응답으로 이미 대체돼서 지웠다(MyPage.jsx 어디에서도 더 이상
 * import 하지 않았던 죽은 코드였다).
 */

/**
 * 활동 요약 카드의 label/tone만 담고 있다 - value/ready는 MyPage.jsx가
 * 실제 API 데이터(translationCount/favoriteCount)로 채운다.
 * "test"(테스트 완료)만 아직 백엔드 기능이 없어 MyPage.jsx에서 ready:false로
 * 고정해 "준비 중"으로 보여준다 - 나중에 기능이 생기면 그 부분만 고치면 된다.
 *
 * "game"(게임 플레이)은 QuizAttempt 로 실데이터가 연동돼 있어 여기 없다 - MyPage.jsx 참고.
 */
export const ACTIVITY_SUMMARY_PLACEHOLDERS = [
  { key: "saved", label: "저장한 번역", tone: "purple" },
  { key: "favorite", label: "즐겨찾기 단어", tone: "mint" },
  { key: "test", label: "테스트 완료", tone: "pink" },
];
