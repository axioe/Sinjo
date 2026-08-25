import { FaCheck } from "react-icons/fa";
import { toLocalDateKey } from "../../utils/date";

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

/** 오늘이 속한 주의 월요일부터 일요일까지 7개 Date 를 돌려준다. */
function getThisWeekDates() {
  const today = new Date();
  const day = today.getDay(); // 0(일) ~ 6(토)
  const mondayOffset = day === 0 ? -6 : 1 - day;

  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

/**
 * 이번 주 사용 기록 (REQ-MY-01).
 *
 * 출석 체크는 로그인 성공 기준이다 - 로그인할 때마다 서버가 오늘 날짜로 자동 기록한다
 * (UserService.login / NaverService.naverLogin 참고). activeDates 는 MyPage 가 한 번만
 * 불러와 내려준다 - 사이드바 "활동 통계" 화면(ActivityStatsPanel)과 같은 데이터를 쓴다.
 * "전체 보기"는 모달이 아니라 사이드바의 "활동 통계" 메뉴로 이동한다(onViewAll).
 */
function WeeklyRecord({ activeDates, onViewAll }) {
  const activeDateSet = activeDates instanceof Set ? activeDates : new Set(activeDates ?? []);
  const weekDates = getThisWeekDates();
  const records = weekDates.map((date, i) => ({
    day: DAY_LABELS[i],
    used: activeDateSet.has(toLocalDateKey(date)),
  }));
  const usedCount = records.filter((r) => r.used).length;

  return (
    <section className="mypage-card">
      <div className="mypage-card-head">
        <h2 className="mypage-card-title">이번 주 사용 기록</h2>
        <button type="button" className="mypage-more" onClick={onViewAll}>
          전체 보기 <span aria-hidden="true">›</span>
        </button>
      </div>

      <ul className="mypage-week">
        {records.map(({ day, used }) => (
          <li key={day} className="mypage-week-item">
            <span className="mypage-week-day">{day}</span>
            <span className={`mypage-week-dot ${used ? "used" : ""}`}>
              {used && <FaCheck />}
            </span>
          </li>
        ))}
      </ul>

      <p className="mypage-week-summary">
        이번 주 {usedCount}일 사용했어요! <span aria-hidden="true">🔥</span>
      </p>
    </section>
  );
}

export default WeeklyRecord;
