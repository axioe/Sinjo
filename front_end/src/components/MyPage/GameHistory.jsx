import "../../css/mypage/GameHistory.css";
import {
  FaGamepad,
  FaCheckCircle,
  FaCalendarAlt,
  FaTrophy,
} from "react-icons/fa";

const TYPE_LABEL = {
  MULTIPLE_CHOICE: {
    label: "객관식",
    tone: "purple",
    icon: "◆",
  },
  INITIAL_SOUND: {
    label: "초성",
    tone: "mint",
    icon: "✓",
  },
  SUBJECTIVE: {
    label: "주관식",
    tone: "pink",
    icon: "✎",
  },
};

function typeInfo(quizType) {
  return (
    TYPE_LABEL[quizType] ?? {
      label: quizType || "알 수 없음",
      tone: "purple",
      icon: "•",
    }
  );
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function GameHistory({ items = [], loading = false }) {
  if (loading) {
    return (
      <section className="mypage-card mypage-game-card">
        <div className="mypage-card-head">
          <div>
            <span className="mypage-card-eyebrow">GAME HISTORY</span>

            <h2 className="mypage-card-title">
              <FaGamepad className="mypage-card-title-icon" />
              게임 기록
            </h2>
          </div>
        </div>

        <div className="mypage-game-loading">
          <FaGamepad />
          <span>게임 기록을 불러오는 중입니다...</span>
        </div>
      </section>
    );
  }

  return (
    <section className="mypage-card mypage-game-card">
      <div className="mypage-card-head">
        <div>
          <span className="mypage-card-eyebrow">GAME HISTORY</span>

          <h2 className="mypage-card-title">
            <FaGamepad className="mypage-card-title-icon" />
            게임 기록
          </h2>
        </div>

        <span className="mypage-game-count">
          총 <strong>{items.length}</strong>회
        </span>
      </div>

      {items.length === 0 ? (
        <div className="mypage-game-empty">
          <div className="mypage-game-empty-icon">
            <FaGamepad />
          </div>

          <strong>아직 플레이한 게임이 없습니다.</strong>

          <p>게임을 플레이하면 기록이 이곳에 표시됩니다.</p>
        </div>
      ) : (
        <ul className="mypage-game-list">
          {items.map((item, index) => {
            const { label, tone, icon } = typeInfo(item.quizType);

            const score = Number(item.score) || 0;
            const total = Number(item.total) || 0;

            const percent =
              total > 0
                ? Math.min(100, Math.round((score / total) * 100))
                : 0;

            return (
              <li
                key={item.id ?? `${item.createdAt}-${index}`}
                className="mypage-game-item"
              >
                <div className={`mypage-game-type-icon ${tone}`}>
                  {icon}
                </div>

                <div className="mypage-game-info">
                  <div className="mypage-game-info-top">
                    <span className={`mypage-game-type ${tone}`}>
                      {label}
                    </span>

                    {percent >= 80 && (
                      <span className="mypage-game-best">
                        <FaTrophy />
                        좋은 점수
                      </span>
                    )}
                  </div>

                  <div className="mypage-game-score-row">
                    <strong>
                      {score}
                      <span>/ {total}</span>
                    </strong>

                    <span className="mypage-game-percent">
                      {percent}%
                    </span>
                  </div>

                  <div className="mypage-game-progress">
                    <span
                      className={tone}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="mypage-game-date">
                    <FaCalendarAlt />
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                </div>

                <div
                  className={`mypage-game-result ${
                    percent >= 80
                      ? "high"
                      : percent >= 50
                        ? "middle"
                        : "low"
                  }`}
                >
                  <FaCheckCircle />
                  <span>
                    {percent >= 80
                      ? "우수"
                      : percent >= 50
                        ? "보통"
                        : "도전"}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default GameHistory;
