import { FaBookmark, FaStar, FaGamepad, FaClipboardList } from "react-icons/fa";

const ICONS = {
  saved: FaBookmark,
  favorite: FaStar,
  game: FaGamepad,
  test: FaClipboardList,
};

function ActivitySummary({ items }) {
  return (
    <section className="mypage-card">
      <h2 className="mypage-card-title">나의 활동 요약</h2>

      <div className="mypage-stat-grid">
        {items.map(({ key, label, value, diff, tone }) => {
          const Icon = ICONS[key];
          return (
            <div key={key} className={`mypage-stat ${tone}`}>
              <span className="mypage-stat-icon">
                <Icon />
              </span>
              <p className="mypage-stat-label">{label}</p>
              <p className="mypage-stat-value">{value}</p>
              <p className="mypage-stat-diff">
                +{diff} <span>지난 달</span>
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default ActivitySummary;
