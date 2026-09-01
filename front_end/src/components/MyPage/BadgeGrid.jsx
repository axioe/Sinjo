import { FaLanguage, FaGamepad, FaComments } from "react-icons/fa";

const ICONS = {
  translate: FaLanguage,
  game: FaGamepad,
  board: FaComments,
};

/**
 * 배지 그리드 (REQ-MY-01).
 * BadgePoints(마이페이지 홈 카드)와 ActivityStatsPanel(사이드바 "활동 통계"
 * 화면) 양쪽에서 같은 배지 목록을 보여주기 위해 그리드만 따로 뺐다.
 *
 * badges 항목에 prototype: true 를 주면 진행률 대신 "준비 중"을 보여준다 -
 * 아직 백엔드가 없는 기능(예: 게시판 이용)을 화면 자리만 잡아둘 때 쓴다.
 * 실제 기능이 완성되면 그 항목에 current/goal 을 채우고 prototype 을
 * 빼기만 하면 된다.
 */
function BadgeGrid({ badges }) {
  return (
    <div className="mypage-badge-grid">
      {badges.map(({ key, name, desc, current, goal, tone, prototype }) => {
        const Icon = ICONS[key];
        const percent = prototype ? 0 : Math.min(Math.round((current / goal) * 100), 100);

        return (
          <div key={key} className={`mypage-badge ${tone} ${prototype ? "prototype" : ""}`}>
            <span className="mypage-badge-hex">
              <Icon />
            </span>
            <p className="mypage-badge-name">{name}</p>
            <p className="mypage-badge-desc">{desc}</p>

            {prototype ? (
              <p className="mypage-badge-pending">준비 중</p>
            ) : (
              <>
                <div className="mypage-badge-bar">
                  <div className="mypage-badge-fill" style={{ width: `${percent}%` }} />
                </div>
                <p className="mypage-badge-count">
                  {current} / {goal}
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
