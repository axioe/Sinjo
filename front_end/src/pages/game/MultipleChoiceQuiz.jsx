import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMultipleChoiceQuiz, checkAnswer, saveQuizAttempt, QUIZ_TYPE } from "../../api/quizApi";
import QuizResult from "./QuizResult";
import QuizProgress from "./QuizProgress";
import "../../css/game/Game.css";

function MultipleChoiceQuiz() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [feedback, setFeedback] = useState(null); // null | { correct, correctAnswer }
  const [checking, setChecking] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    // [수정] 화면을 벗어난 뒤 응답이 도착해 setState 가 호출되는 것을 막는다.
    let alive = true;

    getMultipleChoiceQuiz()
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
    if (!selected || checking) return;

    setChecking(true);
    setSubmitError("");
    try {
      // [수정] 퀴즈 종류를 함께 보낸다. 서버가 종류에 맞게 채점한다.
      const result = await checkAnswer(current, selected, QUIZ_TYPE.MULTIPLE_CHOICE);
      setFeedback(result);
      if (result.correct) setScore((prev) => prev + 1);
    } catch (err) {
      // [수정] checkAnswer 가 정답을 알 수 없는 상황(quizApi.js 참고)에서는
      // 조용히 오답 처리하는 대신 에러를 던진다. 여기서 받아 안내만 하고,
      // feedback 은 null 로 남겨 사용자가 같은 문제를 다시 제출할 수 있게 한다.
      setSubmitError(err.message);
    } finally {
      setChecking(false);
    }
  };

  const handleNext = () => {
    if (index + 1 < quizzes.length) {
      setIndex((prev) => prev + 1);
      setSelected("");
      setFeedback(null);
    } else {
      saveQuizAttempt(QUIZ_TYPE.MULTIPLE_CHOICE, score, quizzes.length);
      setFinished(true);
    }
  };

  // [수정] 문제 목록은 그대로 두고 index/score 만 초기화했더니
  // "다시 하기"를 눌러도 방금 풀었던 5문제가 같은 순서로 다시 나왔다.
  // 새로 불러와야 랜덤 5문제가 다시 섞인다(QuizService.findRandomQuizzes 참고).
  const handleRetry = () => {
    setIndex(0);
    setSelected("");
    setFeedback(null);
    setSubmitError("");
    setScore(0);
    setFinished(false);
    setLoading(true);

    getMultipleChoiceQuiz()
      .then(setQuizzes)
      .finally(() => setLoading(false));
  };

  // [수정] 로딩 중과 "문제가 없음" 을 구분한다.
  // 예전에는 둘 다 "문제를 불러오는 중..." 이라 영원히 로딩처럼 보였다.
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
        <p className="quiz-label">객관식 퀴즈</p>
        <QuizProgress index={index} total={quizzes.length} />

        <h2 className="quiz-question">'{current.word}' 의 알맞은 뜻은?</h2>

        <div className="quiz-options">
          {/* [수정] 같은 보기가 두 번 들어오면 key 가 겹치므로 순번을 함께 쓴다 */}
          {current.options.map((option, i) => (
            <button
              key={`${option}-${i}`}
              type="button"
              className={`quiz-option ${selected === option ? "selected" : ""}`}
              onClick={() => setSelected(option)}
              disabled={feedback !== null}
            >
              {option}
            </button>
          ))}
        </div>

        {feedback !== null && (
          <div className={`quiz-feedback ${feedback.correct ? "correct" : "wrong"}`}>
            {feedback.correct
              ? "정답입니다!"
              : `아쉬워요. 정답은 '${feedback.correctAnswer}' 입니다.`}
          </div>
        )}

        {submitError && (
          <p className="quiz-submit-error" role="alert">{submitError}</p>
        )}

        {feedback === null ? (
          <button
            type="button"
            className="quiz-submit"
            onClick={handleSubmit}
            disabled={!selected || checking}
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

export default MultipleChoiceQuiz;
