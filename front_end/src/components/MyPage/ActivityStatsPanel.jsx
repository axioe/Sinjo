import "../../css/mypage/ActivityStatsPanel.css";
import { useMemo, useState } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaCalendarCheck,
  FaChartLine,
} from "react-icons/fa";

import { toLocalDateKey } from "../../utils/date";

import ActivitySummary from "./ActivitySummary";
import BadgeGrid from "./BadgeGrid";

const WEEKDAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

function getMonthCells(year, month) {
  const firstDay = new Date(year, month, 1);

  const startOffset = (firstDay.getDay() + 6) % 7;

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];

  for (let i = 0; i < startOffset; i += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(year, month, day));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return Array.from({ length: cells.length / 7 }, (_, index) =>
    cells.slice(index * 7, index * 7 + 7),
  );
}

function ActivityStatsPanel({
  activeDates = new Set(),
  activityItems = [],
  badges = [],
}) {
  const today = useMemo(() => new Date(), []);

  const [viewDate, setViewDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const todayKey = toLocalDateKey(today);

  const weeks = useMemo(() => getMonthCells(year, month), [year, month]);

  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}`;

  const monthActiveCount = useMemo(
    () =>
      activeDates
        ? [...activeDates].filter((key) => key.startsWith(monthPrefix)).length
        : 0,
    [activeDates, monthPrefix],
  );

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const attendanceRate =
    daysInMonth > 0 ? Math.round((monthActiveCount / daysInMonth) * 100) : 0;

  const isCurrentMonth =
    year === today.getFullYear() && month === today.getMonth();

  const goPrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const goNextMonth = () => {
    if (isCurrentMonth) {
      return;
    }

    setViewDate(new Date(year, month + 1, 1));
  };

  return (
    <div className="mypage-stats-layout">
      <section className="mypage-card mypage-stats-card">
        <div className="mypage-stats-intro">
          <div className="mypage-stats-intro-icon">
            <FaChartLine />
          </div>

          <div>
            <span className="mypage-card-eyebrow">ACTIVITY STATISTICS</span>

            <h2 className="mypage-card-title">나의 활동 통계</h2>

            <p>꾸준히 활동한 날짜와 나의 학습 기록을 확인해보세요.</p>
          </div>
        </div>

        <div className="mypage-stats-overview">
          <div className="mypage-stats-overview-item">
            <div className="mypage-stats-overview-icon purple">
              <FaCalendarCheck />
            </div>

            <div>
              <span>이번 달 출석</span>

              <strong>
                {monthActiveCount}
                <small>일</small>
              </strong>
            </div>
          </div>

          <div className="mypage-stats-overview-divider" />

          <div className="mypage-stats-overview-item">
            <div className="mypage-stats-overview-icon mint">%</div>

            <div>
              <span>월간 출석률</span>

              <strong>
                {attendanceRate}
                <small>%</small>
              </strong>
            </div>
          </div>

          <div className="mypage-stats-overview-progress">
            <div className="mypage-stats-progress-head">
              <span>이번 달 활동 달성도</span>

              <strong>{attendanceRate}%</strong>
            </div>

            <div className="mypage-stats-progress-bar">
              <span style={{ width: `${attendanceRate}%` }} />
            </div>
          </div>
        </div>

        <div className="mypage-calendar">
          <div className="mypage-calendar-head">
            <button
              type="button"
              className="mypage-calendar-nav"
              onClick={goPrevMonth}
              aria-label="이전 달"
            >
              <FaChevronLeft aria-hidden="true" />
            </button>

            <div className="mypage-calendar-heading">
              <span>ATTENDANCE</span>

              <p className="mypage-calendar-title">
                {year}년 {month + 1}월
              </p>
            </div>

            <button
              type="button"
              className="mypage-calendar-nav"
              onClick={goNextMonth}
              disabled={isCurrentMonth}
              aria-label="다음 달"
            >
              <FaChevronRight aria-hidden="true" />
            </button>
          </div>

          <div className="mypage-calendar-summary">
            <div>
              <span className="mypage-calendar-summary-dot" />

              <span>출석한 날</span>

              <strong>{monthActiveCount}일</strong>
            </div>

            <span className="mypage-calendar-summary-message">
              {monthActiveCount === 0
                ? "이번 달 첫 출석을 시작해보세요!"
                : monthActiveCount >= 20
                  ? "정말 꾸준하게 활동하고 있어요!"
                  : "좋아요! 조금 더 꾸준히 활동해보세요."}
            </span>
          </div>

          <div className="mypage-calendar-grid">
            {WEEKDAY_LABELS.map((label, index) => (
              <span
                key={label}
                className={`mypage-calendar-weekday ${
                  index >= 5 ? "weekend" : ""
                }`}
              >
                {label}
              </span>
            ))}

            {weeks.map((week, weekIndex) =>
              week.map((date, dayIndex) => {
                if (!date) {
                  return (
                    <span
                      key={`empty-${weekIndex}-${dayIndex}`}
                      className="mypage-calendar-cell empty"
                      aria-hidden="true"
                    />
                  );
                }

                const key = toLocalDateKey(date);

                const isActive = activeDates?.has(key);

                const isToday = key === todayKey;

                return (
                  <span
                    key={key}
                    className={[
                      "mypage-calendar-cell",
                      isActive ? "active" : "",
                      isToday ? "today" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    aria-label={`${year}년 ${month + 1}월 ${date.getDate()}일${isActive ? " 출석" : ""}`}
                  >
                    {date.getDate()}

                    {isActive && (
                      <span className="mypage-calendar-active-dot" />
                    )}
                  </span>
                );
              }),
            )}
          </div>

          <div className="mypage-calendar-legend">
            <span>
              <i className="active" />
              출석
            </span>

            <span>
              <i />
              미출석
            </span>

            <span>
              <i className="today" />
              오늘
            </span>
          </div>
        </div>
      </section>

      <section className="mypage-stats-summary-section">
        <div className="mypage-stats-section-heading">
          <div>
            <span>MY ACTIVITY</span>
            <h2>활동 요약</h2>
          </div>
        </div>

        <ActivitySummary items={activityItems} />
      </section>

      <section className="mypage-card mypage-achievement-card">
        <div className="mypage-card-head">
          <div>
            <span className="mypage-card-eyebrow">ACHIEVEMENTS</span>

            <h2 className="mypage-card-title">나의 배지</h2>

            <p className="mypage-achievement-description">
              활동하면서 달성한 목표를 확인해보세요.
            </p>
          </div>

          <span className="mypage-achievement-count">{badges.length}개</span>
        </div>

        <BadgeGrid badges={badges} />
      </section>
    </div>
  );
}

export default ActivityStatsPanel;
