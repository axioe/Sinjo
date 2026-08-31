import { FaGamepad } from "react-icons/fa";

const TYPE_LABEL = {
  MULTIPLE_CHOICE: { label: "객관식", tone: "purple" },
  INITIAL_SOUND: { label: "초성", tone: "mint" },
  SUBJECTIVE: { label: "주관식", tone: "pink" },
};

/** 게임 기록 1행. quizType 이 알 수 없는 값이면 그대로 보여준다(방어적으로). */
function typeInfo(quizType) {
  return TYPE_LABEL[quizType] ?? { label: quizType, tone: "purple" };
}

/**
 * 게임 기록 (REQ-MY-01).
 * QuizAttempt 기반 실데이터다 - 회차마다 어떤 게임을, 몇 점 맞혔는지 보여준다.
 * 정답/오답 내용까지는 저장하지 않아(QuizAttempt 에 점수만 있음) 점수만 표시한다.
 */
function GameHistory({ items }) {
  return (
    <section className="mypage-card">
      <div className="mypage-card-head">
        <h2 className="mypage-card-title">
          <FaGamepad className="mypage-card-title-icon" />
          게임 기록
        </h2>
      </div>

      {items.length === 0 ? (
        <p className="mypage-empty">아직 플레이한 게임이 없습니다.</p>
      ) : (
        <ul className="mypage-game-list">
          {items.map((item) => {
            const { label, tone } = typeInfo(item.quizType);
            const percent = item.total > 0 ? Math.round((item.score / item.total) * 100) : 0;

            return (
              <li key={item.id} className="mypage-game-item">
                <span className={`mypage-game-type ${tone}`}>{label}</span>
                <span className="mypage-game-score">
                  {item.score} / {item.total}
                  <span className="mypage-game-percent">({percent}%)</span>
                </span>
                <span className="mypage-game-date">{item.createdAt}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default GameHistory;
