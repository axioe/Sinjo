import { useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { toLocalDateKey } from "../../utils/date";
import ActivitySummary from "./ActivitySummary";

const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

/** 달력 한 달치 셀을 만든다. 월요일 시작, 앞뒤는 다른 달 자리라 null 로 비워둔다. */
function getMonthCells(year, month) {
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // 일(0) → 월요일 기준 6칸 밀기
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/**
 * "이번 주 사용 기록"의 전체 보기 - 달력으로 출석 날짜를 훑어보고,
 * 같은 화면에 마이페이지의 "나의 활동 요약" 카드를 그대로 재사용해 활동 통계로 함께 보여준다.
 *
 * activeDates: Set<"yyyy-MM-dd">. activityItems: MyPage 에서 계산한 활동 요약 배열 그대로.
 */
function AttendanceCalendarModal({ activeDates, activityItems, onClose }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const weeks = getMonthCells(year, month);
  const todayKey = toLocalDateKey(today);

  const monthActiveCount = activeDates
    ? [...activeDates].filter((key) => key.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)).length
    : 0;

  const goPrevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const goNextMonth = () => setViewDate(new Date(year, month + 1, 1));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card wide" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">활동 통계</h2>

        <section className="mypage-calendar">
          <div className="mypage-calendar-head">
            <button type="button" className="mypage-calendar-nav" onClick={goPrevMonth} aria-label="이전 달">
              <FaChevronLeft />
            </button>
            <p className="mypage-calendar-title">
              {year}년 {month + 1}월
            </p>
            <button type="button" className="mypage-calendar-nav" onClick={goNextMonth} aria-label="다음 달">
              <FaChevronRight />
            </button>
          </div>

          <p className="mypage-calendar-summary">이 달에 {monthActiveCount}일 출석했어요.</p>

          <div className="mypage-calendar-grid">
            {WEEKDAY_LABELS.map((label) => (
              <span key={label} className="mypage-calendar-weekday">{label}</span>
            ))}

            {weeks.flatMap((week, wi) =>
              week.map((date, di) => {
                if (!date) return <span key={`${wi}-${di}`} className="mypage-calendar-cell empty" />;

                const key = toLocalDateKey(date);
                const isActive = activeDates?.has(key);
                const isToday = key === todayKey;

                return (
                  <span
                    key={key}
                    className={`mypage-calendar-cell ${isActive ? "active" : ""} ${isToday ? "today" : ""}`}
                  >
                    {date.getDate()}
                  </span>
                );
              })
            )}
          </div>
        </section>

        <ActivitySummary items={activityItems} />

        <div className="modal-actions">
          <button type="button" className="modal-submit" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

export default AttendanceCalendarModal;
