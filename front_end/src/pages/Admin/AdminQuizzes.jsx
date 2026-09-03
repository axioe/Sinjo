import { useState, useEffect } from "react";
import {
  getQuizWords,
  createQuizWord,
  updateQuizWord,
  deleteQuizWord,
  getWords,
} from "../../api/adminApi";

const EMPTY_FORM = {
  word: "",
  answer: "",
  description: "",
  optionsText: "",
  wordId: null,
};

/** 백엔드 AdminService.MIN_QUIZ_OPTIONS 와 같은 값이어야 한다. */
const MIN_OPTIONS = 2;

/**
 * 퀴즈 관리 (게임 문제 은행)
 * QuizWord 를 등록·수정·삭제한다 - /game 의 객관식/초성/주관식 3개 게임이
 * 전부 이 표에서 랜덤으로 문제를 뽑아 간다(QuizService.findRandomQuizzes 참고).
 *
 * optionsText 는 줄바꿈으로 구분한 객관식 오답 보기다. 최소 개수를 안 채우면
 * 그 문제는 객관식 게임에서 보기가 정답 1개뿐인 채로 나가 문제로서 의미가
 * 없어지기 때문에, 등록 전에 화면에서부터 막는다(서버도 같은 기준으로 다시
 * 검증한다 - AdminService.validateOptions).
 *
 * [추가] 사전 연동 (REQ-QUIZ-LINK).
 * "사전에서 가져오기"로 용어 관리(Word)에 이미 있는 단어를 고르면 신조어/뜻이
 * 자동으로 채워진다 - 같은 단어를 용어 관리와 퀴즈 관리 두 곳에 따로 입력해야
 * 하던 문제를 줄인다. wordId 는 FK 가 아니라 참고용 Long 이라(Favorites.wordId
 * 와 같은 방식) 사전에서 그 단어를 지워도 이 퀴즈 문제는 그대로 남는다.
 * 사전 쪽 뜻이 바뀌었을 때는 "사전에서 다시 가져오기"로 다시 채워 넣고 저장해야
 * 반영된다 - 조용히 자동으로 바뀌면 관리자가 모르는 새 정답이 바뀔 수 있어서다.
 */
function AdminQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [words, setWords] = useState([]);
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
  useEffect(() => {
    getWords()
      .then(setWords)
      .catch(console.error);
  }, []);

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

    const optionCount = form.optionsText
      .split("\n")
      .map((option) => option.trim())
      .filter(Boolean).length;

    if (optionCount < MIN_OPTIONS) {
      found.optionsText = `오답 보기를 ${MIN_OPTIONS}개 이상 입력해 주세요.`;
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
    wordId: form.wordId,
  });

  /** 사전에서 단어를 고르면 신조어/뜻을 그 자리에서 채워 넣는다. */
  const handleSelectWord = (e) => {
    const wordId = e.target.value ? Number(e.target.value) : null;

    if (!wordId) {
      setForm((prev) => ({ ...prev, wordId: null }));
      return;
    }

    const selected = words.find((w) => w.id === wordId);
    if (!selected) return;

    setForm((prev) => ({
      ...prev,
      wordId,
      word: selected.word,
      answer: selected.meaning,
    }));
    setErrors((prev) => ({ ...prev, word: undefined, answer: undefined, form: undefined }));
  };

  /** 연동된 문제의 신조어/뜻을 사전의 지금 값으로 다시 채운다. 저장을 눌러야 반영된다. */
  const handleRefetchFromWord = () => {
    const selected = words.find((w) => w.id === form.wordId);
    if (!selected) return;

    setForm((prev) => ({ ...prev, word: selected.word, answer: selected.meaning }));
  };

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
      wordId: item.wordId ?? null,
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
          <label htmlFor="quiz-word-source">사전에서 가져오기</label>
          <select id="quiz-word-source" value={form.wordId ?? ""} onChange={handleSelectWord}>
            <option value="">직접 입력</option>
            {words.map((w) => (
              <option key={w.id} value={w.id}>
                {w.word}
              </option>
            ))}
          </select>
        </div>

        <div className="admin-field">
          <label htmlFor="quiz-word">
            신조어
            {form.wordId && <span className="admin-badge admin"> 사전 연동</span>}
          </label>
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
          {form.wordId && (
            <button
              type="button"
              className="admin-btn small admin-refetch-btn"
              onClick={handleRefetchFromWord}
            >
              사전에서 다시 가져오기
            </button>
          )}
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
            객관식 오답 보기 (한 줄에 하나씩, 최소 {MIN_OPTIONS}개)
          </label>
          <textarea
            id="quiz-options"
            rows={4}
            value={form.optionsText}
            onChange={setField("optionsText")}
            placeholder={"예:\n답정너\n낄끼빠빠\n존버"}
          />
          {errors.optionsText && (
            <p className="admin-field-error">{errors.optionsText}</p>
          )}
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

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>신조어</th>
                  <th>뜻</th>
                  <th>사전 연동</th>
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

                    <td className="admin-td-word">
                      <button
                        type="button"
                        className="admin-td-word-btn"
                        onClick={() => handleEdit(item)}
                      >
                        {item.word}
                      </button>
                    </td>

                    <td className="admin-td-wrap">{item.answer}</td>

                    <td>
                      {item.wordId ? (
                        <span className="admin-badge admin">연동됨</span>
                      ) : (
                        <span className="admin-badge">직접 입력</span>
                      )}
                    </td>

                    <td className="admin-td-example admin-td-wrap">{item.description}</td>

                    <td>{(item.options || []).length}개</td>

                    <td className="admin-td-actions">
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
          </div>
        </>
      )}
    </>
  );
}

export default AdminQuizzes;
