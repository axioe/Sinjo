import { useState, useEffect } from "react";
import {
  getQuizWords,
  createQuizWord,
  updateQuizWord,
  deleteQuizWord,
} from "../../api/adminApi";

const EMPTY_FORM = {
  word: "",
  answer: "",
  description: "",
  optionsText: "",
};

/**
 * 퀴즈 관리 (게임 문제 은행)
 * QuizWord 를 등록·수정·삭제한다 - /game 의 객관식/초성/주관식 3개 게임이
 * 전부 이 표에서 랜덤으로 문제를 뽑아 간다(QuizService.findRandomQuizzes 참고).
 *
 * optionsText 는 줄바꿈으로 구분한 객관식 오답 보기다. 비워도 등록은 되지만
 * 그 문제는 객관식 게임에서 정답 보기 1개만 나오게 된다.
 */
function AdminQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    getQuizWords()
      .then(setQuizzes)
      .catch((err) => setErrors({ form: err.message }))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const setField = (name) => (e) => {
    setForm((prev) => ({ ...prev, [name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [name]: undefined, form: undefined }));
  };

  const validate = () => {
    const found = {};

    if (!form.word.trim()) {
      found.word = "신조어를 입력해 주세요.";
    }

    if (!form.answer.trim()) {
      found.answer = "뜻(정답)을 입력해 주세요.";
    }

    return found;
  };

  const toPayload = () => ({
    word: form.word.trim(),
    answer: form.answer.trim(),
    description: form.description.trim(),
    options: form.optionsText
      .split("\n")
      .map((option) => option.trim())
      .filter(Boolean),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);

    try {
      if (editingId) {
        await updateQuizWord(editingId, toPayload());
      } else {
        await createQuizWord(toPayload());
      }
      resetForm();
      load();
    } catch (err) {
      setErrors({ ...err.fieldErrors, form: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);

    setForm({
      word: item.word,
      answer: item.answer,
      description: item.description || "",
      optionsText: (item.options || []).join("\n"),
    });

    setErrors({});

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`'${item.word}' 문제를 삭제할까요?`)) return;

    try {
      await deleteQuizWord(item.id);
      // 수정 중이던 항목을 지웠다면 폼도 비운다.
      if (editingId === item.id) resetForm();
      load();
    } catch (err) {
      setErrors({ form: err.message });
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrors({});
  };

  return (
    <>
      <h1 className="admin-title">퀴즈 관리</h1>

      <form className="admin-form" onSubmit={handleSubmit} noValidate>
        <p className="admin-form-title">
          {editingId ? "퀴즈 문제 수정" : "퀴즈 문제 등록"}
        </p>

        {errors.form && <p className="admin-alert">{errors.form}</p>}

        <div className="admin-field">
          <label htmlFor="quiz-word">신조어</label>
          <input
            id="quiz-word"
            value={form.word}
            onChange={setField("word")}
            placeholder="예: 억까"
          />
          {errors.word && <p className="admin-field-error">{errors.word}</p>}
        </div>

        <div className="admin-field">
          <label htmlFor="quiz-answer">뜻 (정답)</label>
          <input
            id="quiz-answer"
            value={form.answer}
            onChange={setField("answer")}
            placeholder="예: 억지로 까기"
          />
          {errors.answer && (
            <p className="admin-field-error">{errors.answer}</p>
          )}
        </div>

        <div className="admin-field">
          <label htmlFor="quiz-description">힌트 / 예문</label>
          <input
            id="quiz-description"
            value={form.description}
            onChange={setField("description")}
            placeholder="초성·주관식 문제에서 힌트로 보여준다 (선택)"
          />
        </div>

        <div className="admin-field">
          <label htmlFor="quiz-options">
            객관식 오답 보기 (한 줄에 하나씩, 선택)
          </label>
          <textarea
            id="quiz-options"
            rows={4}
            value={form.optionsText}
            onChange={setField("optionsText")}
            placeholder={"예:\n답정너\n낄끼빠빠\n존버"}
          />
        </div>

        <div className="admin-form-actions">
          <button
            type="submit"
            className="admin-btn primary"
            disabled={submitting}
          >
            {submitting ? "처리 중..." : editingId ? "수정하기" : "등록하기"}
          </button>

          {editingId && (
            <button type="button" className="admin-btn" onClick={resetForm}>
              취소
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p className="admin-loading">불러오는 중...</p>
      ) : (
        <>
          <p className="admin-desc">전체 {quizzes.length}개</p>

          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>신조어</th>
                <th>뜻</th>
                <th>힌트/예문</th>
                <th>오답 보기</th>
                <th>관리</th>
              </tr>
            </thead>

            <tbody>
              {quizzes.map((item) => (
                <tr
                  key={item.id}
                  className={editingId === item.id ? "editing" : ""}
                >
                  <td>{item.id}</td>

                  <td className="admin-td-word">{item.word}</td>

                  <td>{item.answer}</td>

                  <td className="admin-td-example">{item.description}</td>

                  <td>{(item.options || []).length}개</td>

                  <td className="admin-td-actions">
                    <button
                      type="button"
                      className="admin-btn small"
                      onClick={() => handleEdit(item)}
                    >
                      수정
                    </button>

                    <button
                      type="button"
                      className="admin-btn small danger"
                      onClick={() => handleDelete(item)}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}

export default AdminQuizzes;
