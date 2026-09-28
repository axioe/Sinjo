import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getKnowledgeCheckQuiz,
  checkAnswer,
  saveQuizAttempt,
  QUIZ_TYPE,
} from "../api/quizApi";
import "../css/Test.css";

/**
 * 결과 등급표. score/total 을 백분율로 바꿔 아래 구간에 맞는 등급을 보여준다.
 * 구간은 점수(문항 수)가 아니라 %로 둬서, 문제 수가 나중에 바뀌어도 그대로 쓸 수 있다.
 */
const TIERS = [
  { min: 0, label: "완전 늙크크", emoji: "👴", desc: "신조어는 아직 낯선 외국어 같으신가요? 사전부터 하나씩 둘러보면 금방 친해질 거예요." },
  { min: 20, label: "라떼는 말이야", emoji: "☕", desc: "어렴풋이 들어본 것 같긴 한데... 조금 더 관심을 가져볼 때예요." },
  { min: 40, label: "신조어 초심자", emoji: "🌱", desc: "기본기는 있네요! 조금만 더 보면 금방 따라잡을 수 있어요." },
  { min: 60, label: "신조어 좀 아는 편", emoji: "🔥", desc: "요즘 트렌드에 꽤 밝으시네요. 친구들 사이에서 인정받겠어요!" },
  { min: 80, label: "신조어 마스터", emoji: "🏆", desc: "거의 다 아시네요! 신조어 박사라고 불러도 되겠어요." },
  { min: 100, label: "찐 MZ", emoji: "✨", desc: "완벽합니다! 당신은 신조어의 살아있는 사전이에요." },
];

function getTier(score, total) {
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;
  // TIERS 는 min 오름차순이라, 마지막으로 조건을 만족하는(=가장 높은) 등급을 찾는다.
  return [...TIERS].reverse().find((tier) => percent >= tier.min) ?? TIERS[0];
}

/**
 * 문제 하나를 푸는 두 단계 흐름.
 *  1) "알아요 / 몰라요" 로 먼저 스스로 아는지 체크한다.
 *  2) "알아요" 를 고르면 그 자리에서 객관식 보기를 펼쳐 진짜 아는지 확인한다 -
 *     그냥 안다고 우기는 걸 막기 위함. "몰라요" 는 바로 오답 처리하고 다음으로 넘어간다.
 */
function Question({ quiz, isLast, onDone }) {
  const [phase, setPhase] = useState("ask"); // ask | choices | feedback
  const [selected, setSelected] = useState("");
  const [feedback, setFeedback] = useState(null); // { correct, correctAnswer }
  const [checking, setChecking] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleDontKnow = () => {
    setFeedback({ correct: false, correctAnswer: "" });
    setPhase("feedback");
  };

  const handleKnow = () => {
    setPhase("choices");
  };

  const handleSelect = async (option) => {
    if (checking) return;
    setSelected(option);
    setChecking(true);
    setSubmitError("");
    try {
      const result = await checkAnswer(quiz, option, QUIZ_TYPE.KNOWLEDGE_CHECK);
      setFeedback(result);
      setPhase("feedback");
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="test-card">
      <p className="test-word">'{quiz.word}'</p>
      <p className="test-word-sub">이 신조어, 알고 계신가요?</p>

      {phase === "ask" && (
        <div className="test-know-buttons">
          <button type="button" className="test-know test-know-yes" onClick={handleKnow}>
            😎 알아요
          </button>
          <button type="button" className="test-know test-know-no" onClick={handleDontKnow}>
            🤔 몰라요
          </button>
        </div>
      )}

      {phase === "choices" && (
        <div className="test-options">
          {quiz.options.map((option, i) => (
            <button
              key={`${option}-${i}`}
              type="button"
              className={`test-option ${selected === option ? "selected" : ""}`}
              onClick={() => handleSelect(option)}
              disabled={checking}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      {submitError && (
        <p className="test-submit-error" role="alert">{submitError}</p>
      )}

      {phase === "feedback" && feedback && (
        <>
          <div className={`test-feedback ${feedback.correct ? "correct" : "wrong"}`}>
            {feedback.correct
              ? "정답이에요! 역시 알고 계셨네요."
              : feedback.correctAnswer
                ? `아쉬워요. 정답은 '${feedback.correctAnswer}' 예요.`
                : "다음 신조어로 넘어가볼까요?"}
          </div>

          <button type="button" className="test-next" onClick={() => onDone(feedback.correct)}>
            {isLast ? "결과 보기" : "다음 문제"}
          </button>
        </>
      )}
    </div>
  );
}

function TestResult({ score, total, onRetry }) {
  const tier = getTier(score, total);
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <div className="test-page">
      <div className="test-result">
        <p className="test-result-emoji">{tier.emoji}</p>
        <p className="test-result-tier">{tier.label}</p>
        <p className="test-result-score">
          {score} / {total} 문제 ({percent}%)
        </p>
        <p className="test-result-desc">{tier.desc}</p>

        <div className="test-result-actions">
          <button type="button" className="test-know test-know-yes" onClick={onRetry}>
            다시 하기
          </button>
          <Link to="/">메인으로</Link>
        </div>
      </div>
    </div>
  );
}

function Test() {
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!started) return;

    // loading 초기값이 이미 true(위 useState(true))라, 여기서 다시 켤 필요는 없다 -
    // 이 effect는 started 가 false→true 로 바뀔 때 한 번만 실행된다(재시도는 handleRetry 가 처리).
    let alive = true;

    getKnowledgeCheckQuiz()
      .then((data) => {
        if (alive) setQuizzes(data);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [started]);

  const handleStart = () => setStarted(true);

  const handleQuestionDone = (correct) => {
    const nextScore = correct ? score + 1 : score;
    setScore(nextScore);

    if (index + 1 < quizzes.length) {
      setIndex((prev) => prev + 1);
    } else {
      saveQuizAttempt(QUIZ_TYPE.KNOWLEDGE_CHECK, nextScore, quizzes.length);
      setFinished(true);
    }
  };

  const handleRetry = () => {
    setIndex(0);
    setScore(0);
    setFinished(false);
    setLoading(true);

    getKnowledgeCheckQuiz()
      .then(setQuizzes)
      .finally(() => setLoading(false));
  };

  if (!started) {
    return (
      <div className="test-page">
        <h1>📝 신조어 이해도 테스트</h1>
        <h2>당신은 MZ세대 신조어를 얼마나 알고 있을까요?</h2>
        <button type="button" className="test-start-btn" onClick={handleStart}>테스트 시작</button>
      </div>
    );
  }

  if (loading) {
    return <div className="test-page test-loading">문제를 불러오는 중...</div>;
  }

  if (!quizzes.length) {
    return (
      <div className="test-page test-loading">
        출제할 문제가 없습니다. 잠시 후 다시 시도해 주세요.
      </div>
    );
  }

  if (finished) {
    return <TestResult score={score} total={quizzes.length} onRetry={handleRetry} />;
  }

  return (
    <div className="test-page">
      <div className="test-progress">
        <span>{index + 1} / {quizzes.length}</span>
        <div className="test-progress-bar">
          <div
            className="test-progress-fill"
            style={{ width: `${((index + 1) / quizzes.length) * 100}%` }}
          />
        </div>
      </div>

      <Question
        key={quizzes[index].id}
        quiz={quizzes[index]}
        isLast={index + 1 === quizzes.length}
        onDone={handleQuestionDone}
      />
    </div>
  );
}

export default Test;
