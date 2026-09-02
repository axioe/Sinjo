import { useNavigate } from "react-router-dom";
import { FaCoins, FaStore } from "react-icons/fa";

import BadgeGrid from "./BadgeGrid";

function BadgePoints({ badges = [], point = 0, onViewAll }) {
  const navigate = useNavigate();

  const handlePointShop = () => {
    navigate("/point-shop");
  };

  const safePoint = Number(point) || 0;

  return (
    <section className="mypage-card mypage-badge-points-card">
      <div className="mypage-card-head">
        <div>
          <span className="mypage-card-eyebrow">REWARDS</span>

          <h2 className="mypage-card-title">나의 배지 &amp; 포인트</h2>
        </div>

        <button type="button" className="mypage-more" onClick={onViewAll}>
          전체 보기
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <BadgeGrid badges={badges} />

      <div className="mypage-point">
        <div className="mypage-point-info">
          <div className="mypage-point-icon">
            <FaCoins />
          </div>

          <div>
            <span className="mypage-point-label">현재 보유 포인트</span>

            <strong className="mypage-point-value">
              {safePoint.toLocaleString()}
              <small>P</small>
            </strong>
          </div>
        </div>

        <button
          type="button"
          className="mypage-point-btn"
          onClick={handlePointShop}
        >
          <FaStore />
          포인트 상점
        </button>
      </div>
    </section>
  );
}

export default BadgePoints;
