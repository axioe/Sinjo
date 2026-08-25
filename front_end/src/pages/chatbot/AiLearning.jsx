import { useEffect, useState } from "react";
import { request } from "../../api/client";
import "../../css/chatbot/AiLearning.css";

function AiLearning({ onBack }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const [score, setScore] = useState(0);

  const [finished, setFinished] = useState(false);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  /*
   * 오늘의 AI 학습 문제 가져오기
   */
  useEffect(() => {
    loadQuiz();
  }, []);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await request("/api/ai/learning/today");

      setQuestions(data.questions || []);

      // 새로운 문제를 가져오면 학습 상태 초기화
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setScore(0);
      setFinished(false);
    } catch (error) {
      console.error("AI 학습 문제 조회 실패:", error);

      setError("학습 문제를 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  };

  const completeLearning = async () => {
    const wordIds = questions
      .map((question) => question.wordId)
      .filter((id) => id != null);

    if (wordIds.length === 0) {
      console.warn("학습 완료 처리할 wordId가 없습니다.");
      return;
    }

    await request("/api/ai/learning/complete", {
      method: "POST",
      body: JSON.stringify(wordIds),
    });
  };
  /*
   * 정답 선택
   */
  const handleAnswer = (index) => {
    if (selectedAnswer !== null) {
      return;
    }

    setSelectedAnswer(index);

    const currentQuestion = questions[currentIndex];

    if (index === currentQuestion.answer) {
      setScore((prev) => prev + 1);
    }
  };

  /*
   * 다음 문제
   */
  const handleNext = async () => {
    if (currentIndex + 1 >= questions.length) {
      try {
        await completeLearning();

        setFinished(true);
      } catch (error) {
        console.error("학습 완료 저장 실패:", error);

        setError("학습 완료 저장에 실패했어요.");
      }

      return;
    }

    setCurrentIndex((prev) => prev + 1);

    setSelectedAnswer(null);
  };

  /*
   * 로딩
   */
  if (loading) {
    return (
      <div className="ai-learning">
        <LearningHeader onBack={onBack} />

        <div className="learning-loading">
          <div className="learning-loading-icon">🤖</div>

          <h3>AI가 오늘의 문제를 만들고 있어요</h3>

          <p>잠시만 기다려주세요.</p>
        </div>
      </div>
    );
  }

  /*
   * 에러
   */
  if (error) {
    return (
      <div className="ai-learning">
        <LearningHeader onBack={onBack} />

        <div className="learning-error">
          <div>😥</div>

          <p>{error}</p>

          <button onClick={loadQuiz}>다시 시도</button>
        </div>
      </div>
    );
  }

  /*
   * 문제 없음
   */
  if (questions.length === 0) {
    return (
      <div className="ai-learning">
        <LearningHeader onBack={onBack} />

        <div className="learning-error">
          <div>📚</div>

          <p>아직 학습할 문제가 없습니다.</p>
        </div>
      </div>
    );
  }

  /*
   * 결과 화면
   */
  if (finished) {
    return (
      <div className="ai-learning">
        <LearningHeader onBack={onBack} />

        <div className="learning-result">
          <div className="result-icon">🎉</div>

          <h2>학습 완료!</h2>

          <div className="result-score">
            {score}
            <span> / {questions.length}</span>
          </div>

          <p>오늘의 신조어 학습을 완료했어요.</p>

          <div className="result-buttons">
            <button onClick={loadQuiz}>다시 학습하기</button>

            <button className="secondary" onClick={onBack}>
              AI에게 질문하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="ai-learning">
      <LearningHeader onBack={onBack} />

      {/* Progress */}
      <div className="learning-progress">
        <div
          style={{
            width: `${((currentIndex + 1) / questions.length) * 100}%`,
          }}
        />
      </div>

      <div className="learning-count">
        {currentIndex + 1} / {questions.length}
      </div>

      {/* Question */}
      <div className="learning-question">
        <span className="learning-label">신조어 뜻 맞히기</span>

        <h2>"{currentQuestion.word}"</h2>

        <p>다음 중 올바른 뜻은 무엇일까요?</p>
      </div>

      {/* Answers */}
      <div className="learning-answers">
        {currentQuestion.options.map((option, index) => {
          let className = "learning-answer";

          if (selectedAnswer !== null) {
            if (index === currentQuestion.answer) {
              className += " correct";
            }

            if (index === selectedAnswer && index !== currentQuestion.answer) {
              className += " wrong";
            }
          }

          return (
            <button
              key={index}
              className={className}
              onClick={() => handleAnswer(index)}
            >
              <span>{String.fromCharCode(65 + index)}</span>

              {option}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {selectedAnswer !== null && (
        <div className="learning-explanation">
          <strong>
            {selectedAnswer === questions[currentIndex].answer
              ? "정답입니다! 🎉"
              : "아쉬워요 😢"}
          </strong>

          <p>{questions[currentIndex].explanation}</p>

          <button onClick={handleNext}>
            {currentIndex + 1 === questions.length
              ? "결과 보기"
              : "다음 문제 →"}
          </button>
        </div>
      )}
    </div>
  );
}

/*
 * Learning Header
 */
function LearningHeader({ onBack }) {
  return (
    <div className="learning-header">
      <button className="learning-back" onClick={onBack}>
        ←
      </button>

      <div className="learning-title">🎓 AI 신조어 학습</div>

      <div className="learning-header-space" />
    </div>
  );
}

export default AiLearning;
