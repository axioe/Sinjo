import { FaCheck } from "react-icons/fa";

function WeeklyRecord({ records }) {
  const usedCount = records.filter((r) => r.used).length;

  return (
    <section className="mypage-card">
      <div className="mypage-card-head">
        <h2 className="mypage-card-title">이번 주 사용 기록</h2>
        <button type="button" className="mypage-more">
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
