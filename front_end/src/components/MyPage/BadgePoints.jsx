import { FaCoins } from "react-icons/fa";
import BadgeGrid from "./BadgeGrid";

/** "전체 보기"는 모달이 아니라 사이드바의 "활동 통계" 메뉴로 이동한다(onViewAll). */
function BadgePoints({ badges, point, onViewAll }) {
  return (
    <section className="mypage-card">
      <div className="mypage-card-head">
        <h2 className="mypage-card-title">나의 배지 &amp; 포인트</h2>
        <button type="button" className="mypage-more" onClick={onViewAll}>
          전체 보기 <span aria-hidden="true">›</span>
        </button>
      </div>

      <BadgeGrid badges={badges} />

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
