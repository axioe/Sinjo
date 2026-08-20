import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getInitialSoundQuiz, checkAnswer, QUIZ_TYPE } from "../api/quizApi";
import QuizResult from "./QuizResult";
import QuizProgress from "./QuizProgress";
import "../css/Game.css";

function InitialSoundQuiz() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [checking, setChecking] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    let alive = true;

    getInitialSoundQuiz()
      .then((data) => {
        if (alive) setQuizzes(data);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const current = quizzes[index];

  const handleSubmit = async () => {
    if (!input.trim() || checking) return;

    setChecking(true);
    try {
      const result = await checkAnswer(current, input.trim(), QUIZ_TYPE.INITIAL_SOUND);
      setFeedback(result);
      if (result.correct) setScore((prev) => prev + 1);
    } finally {
      setChecking(false);
    }
  };

  const handleNext = () => {
    if (index + 1 < quizzes.length) {
      setIndex((prev) => prev + 1);
      setInput("");
      setFeedback(null);
    } else {
      setFinished(true);
    }
  };

  const handleRetry = () => {
    setIndex(0);
    setInput("");
    setFeedback(null);
    setScore(0);
    setFinished(false);
  };

  // Enter 로도 진행할 수 있게 한다.
  const handleKeyDown = (e) => {
    if (e.key !== "Enter") return;

    // [수정] 한글 조합 중에 눌린 Enter 는 무시한다.
    // 없으면 "억까" 를 치는 도중 마지막 글자가 확정되기 전에 채점되어 오답이 된다.
    if (e.nativeEvent?.isComposing) return;

    e.preventDefault();
    if (feedback === null) handleSubmit();
    else handleNext();
  };

  if (loading) return <div className="quiz-loading">문제를 불러오는 중...</div>;

  if (!quizzes.length) {
    return (
      <div className="quiz-page">
        <Link to="/game" className="quiz-back">← 게임 선택으로</Link>
        <div className="quiz-loading">출제할 문제가 없습니다. 잠시 후 다시 시도해 주세요.</div>
      </div>
    );
  }

  if (finished) return <QuizResult score={score} total={quizzes.length} onRetry={handleRetry} />;

  return (
    <div className="quiz-page">
      <Link to="/game" className="quiz-back">← 게임 선택으로</Link>

      <div className="quiz-card">
        <p className="quiz-label">초성 퀴즈</p>
        <QuizProgress index={index} total={quizzes.length} />

        <div className="quiz-initial">{current.initialSound}</div>

        {current.hint && <p className="quiz-hint">💡 힌트: {current.hint}</p>}

        <input
          className="quiz-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="단어를 입력하세요"
          aria-label="정답 입력"
          disabled={feedback !== null}
        />

        {feedback !== null && (
          <div className={`quiz-feedback ${feedback.correct ? "correct" : "wrong"}`}>
            {feedback.correct
              ? "정답입니다!"
              : `아쉬워요. 정답은 '${feedback.correctAnswer}' 입니다.`}
          </div>
        )}

        {feedback === null ? (
          <button
            type="button"
            className="quiz-submit"
            onClick={handleSubmit}
            disabled={!input.trim() || checking}
          >
            {checking ? "확인 중..." : "정답 확인"}
          </button>
        ) : (
          <button type="button" className="quiz-submit" onClick={handleNext}>
            {index + 1 === quizzes.length ? "결과 보기" : "다음 문제"}
          </button>
        )}
      </div>
    </div>
  );
}

export default InitialSoundQuiz;
