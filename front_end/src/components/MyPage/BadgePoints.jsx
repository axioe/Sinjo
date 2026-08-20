import { FaStar, FaComments, FaGamepad, FaCoins } from "react-icons/fa";

const ICONS = {
  explorer: FaStar,
  master: FaComments,
  player: FaGamepad,
};

function BadgePoints({ badges, point }) {
  return (
    <section className="mypage-card">
      <div className="mypage-card-head">
        <h2 className="mypage-card-title">나의 배지 &amp; 포인트</h2>
        <button type="button" className="mypage-more">
          전체 보기 <span aria-hidden="true">›</span>
        </button>
      </div>

      <div className="mypage-badge-grid">
        {badges.map(({ key, name, desc, current, goal, tone }) => {
          const Icon = ICONS[key];
          const percent = Math.min(Math.round((current / goal) * 100), 100);

          return (
            <div key={key} className={`mypage-badge ${tone}`}>
              <span className="mypage-badge-hex">
                <Icon />
              </span>
              <p className="mypage-badge-name">{name}</p>
              <p className="mypage-badge-desc">{desc}</p>

              <div className="mypage-badge-bar">
                <div className="mypage-badge-fill" style={{ width: `${percent}%` }} />
              </div>
              <p className="mypage-badge-count">
                {current} / {goal}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mypage-point">
        <span className="mypage-point-label">
          <FaCoins className="mypage-point-icon" />
          포인트 보유량
        </span>
        <strong className="mypage-point-value">
          {point.toLocaleString()}P
        </strong>
        <button type="button" className="mypage-point-btn">포인트 상점</button>
      </div>
    </section>
  );
}

export default BadgePoints;
