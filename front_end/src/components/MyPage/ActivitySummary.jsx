import "../../css/mypage/ActivitySummary.css";
import { FaBookmark, FaStar, FaGamepad, FaClipboardList } from "react-icons/fa";

const ICONS = {
  saved: FaBookmark,
  favorite: FaStar,
  game: FaGamepad,
  test: FaClipboardList,
};

/**
 * items:
 * {
 *   key,
 *   label,
 *   tone,
 *   ready,
 *   value?,
 *   diff?
 * }[]
 *
 * ready=false:
 *   실제 데이터를 아직 제공할 수 없는 기능.
 *
 * ready=true:
 *   value를 표시하고, diff가 있을 경우 이번 달 변화량을 표시한다.
 */
function ActivitySummary({ items = [] }) {
  return (
    <section className="mypage-card">
      <h2 className="mypage-card-title">나의 활동 요약</h2>

      <div className="mypage-stat-grid">
        {items.map(({ key, label, value, diff, tone, ready }) => {
          const Icon = ICONS[key];

          return (
            <div
              key={key}
              className={`mypage-stat ${tone || ""} ${ready ? "" : "pending"}`}
            >
              <span className="mypage-stat-icon">
                {Icon ? <Icon aria-hidden="true" /> : null}
              </span>

              <p className="mypage-stat-label">{label}</p>

              {ready ? (
                <>
                  <p className="mypage-stat-value">{value ?? 0}</p>

                  {diff !== undefined && diff !== null && (
                    <p className="mypage-stat-diff">
                      +{diff} <span>이번 달</span>
                    </p>
                  )}
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
