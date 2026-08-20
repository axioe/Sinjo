import { useState, useEffect } from "react";
import {
  getWords,
  createWord,
  updateWord,
  deleteWord,
} from "../../api/adminApi";

const CATEGORY_OPTIONS = ["게임", "인터넷", "일상", "자기계발", "직장", "기타"];

const EMPTY_FORM = {
  word: "",
  meaning: "",
  example: "",
  category: "기타",
};

/**
 * 용어 관리 (REQ-ADM-01)
 * 등록 · 수정 · 삭제가 즉시 DB 에 반영된다.
 */
function AdminWords() {
  const [words, setWords] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = () => {
    getWords()
      .then(setWords)
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

    if (!form.meaning.trim()) {
      found.meaning = "뜻을 입력해 주세요.";
    }

    if (!form.example.trim()) {
      found.example = "예문을 입력해 주세요.";
    }

    if (!form.category.trim()) {
      found.category = "카테고리를 선택해 주세요.";
    }

    return found;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);

    try {
      if (editingId) {
        await updateWord(editingId, form);
      } else {
        await createWord(form);
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
      meaning: item.meaning,
      example: item.example,
      category: item.category || "기타",
    });

    setErrors({});

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`'${item.word}' 을(를) 삭제할까요?`)) return;

    try {
      await deleteWord(item.id);
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
      <h1 className="admin-title">용어 관리</h1>

      <form className="admin-form" onSubmit={handleSubmit} noValidate>
        <p className="admin-form-title">
          {editingId ? "신조어 수정" : "신조어 등록"}
        </p>

        {errors.form && <p className="admin-alert">{errors.form}</p>}

        <div className="admin-field">
          <label htmlFor="word">신조어</label>
          <input
            id="word"
            value={form.word}
            onChange={setField("word")}
            placeholder="예: 갓생"
          />
          {errors.word && <p className="admin-field-error">{errors.word}</p>}
        </div>

        <div className="admin-field">
          <label htmlFor="meaning">뜻</label>
          <input
            id="meaning"
            value={form.meaning}
            onChange={setField("meaning")}
            placeholder="예: 부지런하고 계획적인 삶"
          />
          {errors.meaning && (
            <p className="admin-field-error">{errors.meaning}</p>
          )}
        </div>

        <div className="admin-field">
          <label htmlFor="example">예문</label>
          <input
            id="example"
            value={form.example}
            onChange={setField("example")}
            placeholder="예: 요즘 운동하면서 갓생 살고 있어."
          />
          {errors.example && (
            <p className="admin-field-error">{errors.example}</p>
          )}
        </div>

        {/* 카테고리 */}
        <div className="admin-field">
          <label htmlFor="category">카테고리</label>

          <select
            id="category"
            value={form.category}
            onChange={setField("category")}
          >
            {CATEGORY_OPTIONS.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          {errors.category && (
            <p className="admin-field-error">{errors.category}</p>
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
          <p className="admin-desc">전체 {words.length}개</p>

          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>신조어</th>
                <th>카테고리</th>
                <th>뜻</th>
                <th>예문</th>
                <th>좋아요</th>
                <th>관리</th>
              </tr>
            </thead>

            <tbody>
              {words.map((item) => (
                <tr
                  key={item.id}
                  className={editingId === item.id ? "editing" : ""}
                >
                  <td>{item.id}</td>

                  <td className="admin-td-word">{item.word}</td>

                  <td>{item.category?.trim() || "기타"}</td>

                  <td>{item.meaning}</td>

                  <td className="admin-td-example">{item.example}</td>

                  <td>{item.likes}</td>

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

export default AdminWords;
