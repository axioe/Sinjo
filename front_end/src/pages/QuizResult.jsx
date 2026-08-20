import { Link } from "react-router-dom";
import "../css/Game.css";

function QuizResult({ score, total, onRetry }) {
  const percent = Math.round((score / total) * 100);

  let message;
  if (percent === 100) message = "완벽합니다. 신조어 마스터네요!";
  else if (percent >= 60) message = "꽤 잘 아시네요. 조금만 더!";
  else message = "아직 낯선 말이 많네요. 사전을 둘러볼까요?";

  return (
    <div className="quiz-page">
      <div className="quiz-result">
        <p className="quiz-result-score">
          {score} / {total}
        </p>
        <p className="quiz-result-desc">{message}</p>

        <div className="quiz-result-actions">
          <button type="button" className="primary" onClick={onRetry}>
            다시 하기
          </button>
          <Link to="/game">다른 게임 하기</Link>
        </div>
      </div>
    </div>
  );
}

export default QuizResult;
