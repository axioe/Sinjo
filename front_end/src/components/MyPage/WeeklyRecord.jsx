import { useEffect, useState } from "react";
import { FaCheck } from "react-icons/fa";
import { getMyAttendance } from "../../api/attendanceApi";
import { toLocalDateKey } from "../../utils/date";
import AttendanceCalendarModal from "./AttendanceCalendarModal";

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
 * (UserService.login / NaverService.naverLogin 참고). activeDates 를 못 불러온 동안(null)에는
 * 아무 날도 체크하지 않은 채로 보여준다.
 */
function WeeklyRecord({ activityItems }) {
  const [activeDates, setActiveDates] = useState(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let alive = true;

    getMyAttendance().then((dates) => {
      if (alive) setActiveDates(dates);
    });

    return () => {
      alive = false;
    };
  }, []);

  const activeDateSet = new Set(activeDates ?? []);
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
        <button type="button" className="mypage-more" onClick={() => setShowAll(true)}>
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

      {showAll && (
        <AttendanceCalendarModal
          activeDates={activeDateSet}
          activityItems={activityItems}
          onClose={() => setShowAll(false)}
        />
      )}
    </section>
  );
}

export default WeeklyRecord;
