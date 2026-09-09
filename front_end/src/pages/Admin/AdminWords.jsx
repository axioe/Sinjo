import { useState, useEffect, useRef, useMemo } from "react";
import {
  getWords,
  createWord,
  updateWord,
  deleteWord,
  uploadWordsExcel,
  previewWordsExcel,
  downloadWordTemplate,
} from "../../api/adminApi";
import { FaFileExcel, FaDownload } from "react-icons/fa";

const CATEGORY_OPTIONS = ["일상", "인터넷", "게임", "SNS", "직장", "기타"];

const EMPTY_FORM = {
  word: "",
  meaning: "",
  example: "",
  category: "기타",
};

const STATUS_LABEL = {
  OK: "등록 가능",
  DUPLICATE: "중복",
  ERROR: "오류",
};

/**
 * 용어 관리 (REQ-ADM-01)
 * 등록 · 수정 · 삭제가 즉시 DB 에 반영된다.
 * 엑셀은 미리보기로 먼저 검증한 뒤 관리자가 확인해야 등록된다.
 */
function AdminWords() {
  const [words, setWords] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("전체");
  const [keyword, setKeyword] = useState("");

  // 엑셀 미리보기
  const [previewRows, setPreviewRows] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewing, setPreviewing] = useState(false);

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

  /** 파일을 고르면 등록하지 않고 검증 결과부터 보여준다. */
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";

    setPreviewing(true);
    setErrors({});

    try {
      const fd = new FormData();
      fd.append("file", file);

      const rows = await previewWordsExcel(fd);

      if (rows.length === 0) {
        alert("읽을 수 있는 데이터가 없습니다.\n1행은 머리글, 2행부터 데이터를 넣어 주세요.");
        return;
      }

      // 등록 단계에서 같은 파일을 한 번 더 보내야 하므로 들고 있는다.
      setPreviewFile(file);
      setPreviewRows(rows);
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setPreviewing(false);
    }
  };

  const closePreview = () => {
    setPreviewRows(null);
    setPreviewFile(null);
  };

  const handleConfirmUpload = async () => {
    if (!previewFile) return;

    setUploading(true);

    try {
      const fd = new FormData();
      fd.append("file", previewFile);

      const result = await uploadWordsExcel(fd);

      let msg = `${result.successCount}건이 등록되었습니다.`;
      if (result.skipCount > 0) msg += `\n중복 ${result.skipCount}건은 제외했습니다.`;
      alert(msg);

      closePreview();
      load();
    } catch (err) {
      setErrors({ form: err.message });
      closePreview();
    } finally {
      setUploading(false);
    }
  };

  const handleTemplateDownload = async () => {
    try {
      await downloadWordTemplate();
    } catch (err) {
      setErrors({ form: err.message });
    }
  };

  const previewSummary = useMemo(() => {
    if (!previewRows) return null;

    return {
      total: previewRows.length,
      ok: previewRows.filter((r) => r.status === "OK").length,
      duplicate: previewRows.filter((r) => r.status === "DUPLICATE").length,
      error: previewRows.filter((r) => r.status === "ERROR").length,
    };
  }, [previewRows]);

  // 카테고리별 개수. 탭에 함께 보여줘 어디에 몰려 있는지 바로 알 수 있게 한다.
  const categoryCounts = useMemo(() => {
    const counts = {};
    for (const item of words) {
      const key = item.category?.trim() || "기타";
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [words]);

  // 전체 목록을 한 번에 받아오므로 걸러내는 일은 화면에서 처리한다.
  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();

    return words.filter((item) => {
      const category = item.category?.trim() || "기타";

      if (categoryFilter !== "전체" && category !== categoryFilter)
        return false;
      if (!q) return true;

      return (
        item.word?.toLowerCase().includes(q) ||
        item.meaning?.toLowerCase().includes(q)
      );
    });
  }, [words, categoryFilter, keyword]);

  return (
    <>
      <h1 className="admin-title">용어 관리</h1>

      <form className="admin-form" onSubmit={handleSubmit} noValidate>
        <div className="admin-form-header">
          <p className="admin-form-title">
            {editingId ? "신조어 수정" : "신조어 등록"}
          </p>

          {!editingId && (
            <div className="admin-form-header-actions">
              <button
                type="button"
                className="admin-btn small"
                onClick={handleTemplateDownload}
              >
                <FaDownload />
                양식 다운로드
              </button>

              <button
                type="button"
                className="admin-btn excel"
                onClick={() => fileRef.current.click()}
                disabled={previewing || uploading}
              >
                <FaFileExcel />
                {previewing ? "확인 중..." : "엑셀 일괄 등록"}
              </button>

              <input
                type="file"
                ref={fileRef}
                onChange={handleFileChange}
                accept=".xlsx,.xls"
                style={{ display: "none" }}
              />
            </div>
          )}
        </div>

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
      </form>

      {loading ? (
        <p className="admin-loading">불러오는 중...</p>
      ) : (
        <>
          <div className="admin-filter-bar">
            <div className="admin-filter-tabs">
              <button
                type="button"
                className={`admin-filter-tab ${categoryFilter === "전체" ? "active" : ""}`}
                onClick={() => setCategoryFilter("전체")}
              >
                전체 {words.length}
              </button>

              {CATEGORY_OPTIONS.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`admin-filter-tab ${categoryFilter === category ? "active" : ""}`}
                  onClick={() => setCategoryFilter(category)}
                >
                  {category} {categoryCounts[category] ?? 0}
                </button>
              ))}
            </div>

            <input
              type="search"
              className="admin-filter-search"
              placeholder="신조어 또는 뜻 검색"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <p className="admin-desc">
            {filtered.length}개
            {filtered.length !== words.length && ` / 전체 ${words.length}개`}
          </p>

          <div className="admin-table-wrap">
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
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="admin-empty">
                      조건에 맞는 신조어가 없습니다.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
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

                      <td>{item.category?.trim() || "기타"}</td>

                      <td className="admin-td-wrap">{item.meaning}</td>

                      <td className="admin-td-example admin-td-wrap">
                        {item.example}
                      </td>

                      <td>{item.likes}</td>

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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {previewRows && (
        <div className="excel-preview-backdrop" onMouseDown={closePreview}>
          <section
            className="excel-preview-modal"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <header className="excel-preview-header">
              <h2>업로드 미리보기</h2>

              <button
                type="button"
                className="excel-preview-close"
                onClick={closePreview}
                aria-label="닫기"
              >
                ×
              </button>
            </header>

            <div className="excel-preview-summary">
              총 {previewSummary.total}행
              <span className="ok"> · 등록 가능 {previewSummary.ok}건</span>
              {previewSummary.duplicate > 0 && (
                <span className="dup"> · 중복 {previewSummary.duplicate}건</span>
              )}
              {previewSummary.error > 0 && (
                <span className="err"> · 오류 {previewSummary.error}건</span>
              )}
            </div>

            <p className="excel-preview-hint">
              중복·오류 행은 등록되지 않습니다. 파일을 고친 뒤 다시 올려 주세요.
            </p>

            <div className="excel-preview-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>행</th>
                    <th>신조어</th>
                    <th>뜻</th>
                    <th>예문</th>
                    <th>카테고리</th>
                    <th>상태</th>
                  </tr>
                </thead>

                <tbody>
                  {previewRows.map((row) => (
                    <tr
                      key={row.rowNum}
                      className={`excel-preview-row ${row.status.toLowerCase()}`}
                    >
                      <td>{row.rowNum}</td>
                      <td className="admin-td-word">{row.word || "-"}</td>
                      <td className="admin-td-wrap">{row.meaning || "-"}</td>
                      <td className="admin-td-wrap">{row.example || "-"}</td>
                      <td>{row.category}</td>
                      <td className="admin-td-wrap">
                        <span className={`excel-preview-status ${row.status.toLowerCase()}`}>
                          {STATUS_LABEL[row.status]}
                        </span>
                        {row.message && (
                          <span className="excel-preview-message">
                            {row.message}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="excel-preview-actions">
              <button type="button" className="admin-btn" onClick={closePreview}>
                취소
              </button>

              <button
                type="button"
                className="admin-btn primary"
                onClick={handleConfirmUpload}
                disabled={uploading || previewSummary.ok === 0}
              >
                {uploading
                  ? "등록 중..."
                  : previewSummary.ok === 0
                    ? "등록할 항목 없음"
                    : `${previewSummary.ok}건 등록하기`}
              </button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}

export default AdminWords;