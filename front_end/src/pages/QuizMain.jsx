import { Link } from "react-router-dom";
import "../css/Game.css";

/**
 * 게임 종류 선택 (REQ-GAME-01)
 * 메인의 "게임 시작" 버튼이 /game 으로 보내면 이 화면이 뜬다.
 */
const QUIZ_TYPES = [
  {
    to: "/game/multiple",
    modifier: "multiple",
    badge: "객관식",
    name: "뜻 맞추기",
    hint: "신조어를 보고 알맞은 뜻을 네 개 보기 중에서 고릅니다.",
  },
  {
    to: "/game/initial",
    modifier: "initial",
    badge: "초성",
    name: "단어 맞추기",
    hint: "초성과 힌트를 보고 어떤 신조어인지 직접 입력합니다.",
  },
  {
    to: "/game/subjective",
    modifier: "subjective",
    badge: "주관식",
    name: "신조어 쓰기",
    hint: "설명을 읽고 해당하는 신조어를 직접 적어봅니다.",
  },
];

function QuizMain() {
  return (
    <div className="quiz-page">
      <h1 className="quiz-select-title">🎮 신조어 게임</h1>
      <p className="quiz-select-desc">해보고 싶은 게임을 골라주세요.</p>

      <div className="quiz-select-list">
        {QUIZ_TYPES.map((type) => (
          <Link
            key={type.to}
            to={type.to}
            className={`quiz-select-card ${type.modifier}`}
          >
            <span className="quiz-select-badge">{type.badge}</span>
            <h2 className="quiz-select-name">{type.name}</h2>
            <p className="quiz-select-hint">{type.hint}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default QuizMain;
