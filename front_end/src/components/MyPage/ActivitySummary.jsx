import { FaBookmark, FaStar, FaGamepad, FaClipboardList } from "react-icons/fa";

const ICONS = {
  saved: FaBookmark,
  favorite: FaStar,
  game: FaGamepad,
  test: FaClipboardList,
};

/**
 * items: { key, label, tone, ready, value?, diff? }[]
 *
 * ready=false 인 카드는 아직 실데이터를 낼 기능(번역 저장, 즐겨찾기 등)이 없다는 뜻이다.
 * 숫자를 지어내는 대신 "준비 중"으로 자리만 비워둔다 - 해당 기능을 만드는 사람이
 * 이 items 배열에 value/diff/ready:true 만 채워 넣으면 된다.
 */
function ActivitySummary({ items }) {
  return (
    <section className="mypage-card">
      <h2 className="mypage-card-title">나의 활동 요약</h2>

      <div className="mypage-stat-grid">
        {items.map(({ key, label, value, diff, tone, ready }) => {
          const Icon = ICONS[key];
          return (
            <div key={key} className={`mypage-stat ${tone} ${ready ? "" : "pending"}`}>
              <span className="mypage-stat-icon">
                <Icon />
              </span>
              <p className="mypage-stat-label">{label}</p>
              {ready ? (
                <>
                  <p className="mypage-stat-value">{value}</p>
                  <p className="mypage-stat-diff">
                    +{diff} <span>이번 달</span>
                  </p>
                </>
              ) : (
                <p className="mypage-stat-pending">준비 중</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default ActivitySummary;
