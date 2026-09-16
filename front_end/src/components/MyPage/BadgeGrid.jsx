import "../../css/mypage/BadgeGrid.css";
import { FaLanguage, FaGamepad, FaLightbulb, FaComments } from "react-icons/fa";

const ICONS = {
  translate: FaLanguage,
  game: FaGamepad,
  studio: FaLightbulb,
  board: FaComments,
};

/**
 * 배지 그리드 (REQ-MY-01).
 * BadgePoints(마이페이지 홈 카드)와 ActivityStatsPanel(사이드바 "활동 통계"
 * 화면) 양쪽에서 같은 배지 목록을 보여주기 위해 그리드만 따로 뺐다.
 *
 * badges 항목에 prototype: true 를 주면 진행률 대신 "준비 중"을 보여준다.
 * 지금은 번역/게임/제작소 세 항목 모두 실데이터다.
 *
 * key 에 맞는 아이콘이 없어도 화면이 죽지 않게 Icon 존재 여부를 확인한다.
 */
function BadgeGrid({ badges = [] }) {
  return (
    <div className="mypage-badge-grid">
      {badges.map(({ key, name, desc, current, goal, tone, prototype }) => {
        const Icon = ICONS[key];

        const safeGoal = Number(goal) || 0;
        const safeCurrent = Number(current) || 0;

        const percent =
          prototype || safeGoal === 0
            ? 0
            : Math.min(Math.round((safeCurrent / safeGoal) * 100), 100);

        return (
          <div
            key={key}
            className={`mypage-badge ${tone ?? ""} ${prototype ? "prototype" : ""}`}
          >
            <span className="mypage-badge-hex">{Icon ? <Icon /> : null}</span>

            <p className="mypage-badge-name">{name}</p>
            <p className="mypage-badge-desc">{desc}</p>

            {prototype ? (
              <p className="mypage-badge-pending">준비 중</p>
            ) : (
              <>
                <div className="mypage-badge-bar">
                  <div
                    className="mypage-badge-fill"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="mypage-badge-count">
                  {safeCurrent} / {safeGoal}
                </p>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default BadgeGrid;