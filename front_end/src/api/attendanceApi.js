import { request } from "./client";

/**
 * 마이페이지 "이번 주 사용 기록" / 활동 통계 달력용 (REQ-MY-01).
 * 로그인에 성공하면 서버가 오늘 날짜로 출석을 자동 기록한다 (UserService.login /
 * NaverService.naverLogin 참고) - 프론트는 그 결과를 조회만 한다.
 */

/**
 * 로그인하지 않았거나 조회에 실패하면 null 을 돌려준다. 호출하는 쪽에서 null 이면
 * 출석 표시 없이 빈 상태로 보여준다.
 */
export async function getMyAttendance() {
  try {
    const { activeDates } = await request("/api/attendance/me");
    return activeDates ?? [];
  } catch (error) {
    console.warn("[attendanceApi] 출석 기록 조회 실패", error);
    return null;
  }
}
