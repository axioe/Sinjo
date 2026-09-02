function QuizProgress({ index, total }) {
  return (
    <div className="quiz-progress">
      <span>
        {index + 1} / {total}
      </span>
      <div className="quiz-progress-bar">
        <div
          className="quiz-progress-fill"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

export default QuizProgress;
