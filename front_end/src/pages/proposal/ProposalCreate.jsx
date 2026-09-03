import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createProposal } from "../../api/proposalApi";
import "../../css/proposal/ProposalCreate.css";

const initialForm = {
  proposedWord: "",
  meaning: "",
  example: "",
  description: "",
  sourceDescription: "",
};

function ProposalCreate() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.proposedWord.trim()) {
      setError("신조어를 입력해주세요.");
      return;
    }

    if (!form.meaning.trim()) {
      setError("신조어의 의미를 입력해주세요.");
      return;
    }

    if (!form.example.trim()) {
      setError("사용 예시를 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await createProposal({
        proposedWord: form.proposedWord.trim(),
        meaning: form.meaning.trim(),
        example: form.example.trim(),
        description: form.description.trim(),
        sourceDescription: form.sourceDescription.trim(),
      });

      // 등록 성공 → 등록된 제안 상세 페이지
      navigate(`/proposals/${result.id}`);
    } catch (err) {
      console.error("신조어 제안 등록 실패:", err);

      if (err.status === 401) {
        setError("로그인이 필요한 기능입니다.");
      } else if (err.status === 400) {
        setError(
          err.message || "입력 내용을 확인해주세요."
        );
      } else {
        setError(
          err.message || "신조어 제안 등록에 실패했습니다."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/proposals");
  };

  return (
    <main className="proposal-create">
      <div className="proposal-create-inner">

        {/* 상단 */}
        <div className="proposal-create-header">
          <div>
            <span className="proposal-create-eyebrow">
              NEW WORD
            </span>

            <h1>신조어 제안</h1>

            <p>
              새롭게 생겨난 재미있는 단어나 표현을
              신조어 사전에 제안해주세요.
            </p>
          </div>
        </div>

        {/* 폼 */}
        <form
          className="proposal-create-form"
          onSubmit={handleSubmit}
        >
          <section className="proposal-form-card">

            <div className="proposal-form-group">
              <label htmlFor="proposedWord">
                신조어 <span>*</span>
              </label>

              <input
                id="proposedWord"
                name="proposedWord"
                type="text"
                value={form.proposedWord}
                onChange={handleChange}
                placeholder="예: 갓생"
                maxLength={50}
                disabled={loading}
              />

              <div className="proposal-form-help">
                새로운 신조어나 표현을 입력해주세요.
              </div>
            </div>

            <div className="proposal-form-group">
              <label htmlFor="meaning">
                의미 <span>*</span>
              </label>

              <textarea
                id="meaning"
                name="meaning"
                value={form.meaning}
                onChange={handleChange}
                placeholder="이 신조어가 어떤 의미로 사용되는지 설명해주세요."
                maxLength={500}
                rows={4}
                disabled={loading}
              />

              <div className="proposal-form-count">
                {form.meaning.length} / 500
              </div>
            </div>

            <div className="proposal-form-group">
              <label htmlFor="example">
                사용 예시 <span>*</span>
              </label>

              <textarea
                id="example"
                name="example"
                value={form.example}
                onChange={handleChange}
                placeholder="실제 대화나 문장에서 어떻게 사용하는지 작성해주세요."
                maxLength={1000}
                rows={5}
                disabled={loading}
              />

              <div className="proposal-form-count">
                {form.example.length} / 1000
              </div>
            </div>

            <div className="proposal-form-group">
              <label htmlFor="description">
                상세 설명
              </label>

              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="어떻게 만들어진 표현인지, 어떤 상황에서 사용하는지 자유롭게 작성해주세요."
                maxLength={2000}
                rows={6}
                disabled={loading}
              />

              <div className="proposal-form-count">
                {form.description.length} / 2000
              </div>
            </div>

            <div className="proposal-form-group">
              <label htmlFor="sourceDescription">
                출처 / 유래
              </label>

              <textarea
                id="sourceDescription"
                name="sourceDescription"
                value={form.sourceDescription}
                onChange={handleChange}
                placeholder="어디에서 처음 접했는지, 유래를 알고 있다면 작성해주세요."
                maxLength={1000}
                rows={4}
                disabled={loading}
              />

              <div className="proposal-form-count">
                {form.sourceDescription.length} / 1000
              </div>
            </div>

          </section>

          {/* 안내 */}
          <div className="proposal-create-notice">
            <strong>💡 제안하기 전에 확인해주세요</strong>

            <ul>
              <li>
                이미 사전에 등록된 단어인지 확인해주세요.
              </li>
              <li>
                다른 사람이 이해할 수 있도록 의미와 사용 예시를
                구체적으로 작성해주세요.
              </li>
              <li>
                등록된 제안은 다른 사용자들의 의견을 통해
                검토될 수 있습니다.
              </li>
            </ul>
          </div>

          {/* 에러 */}
          {error && (
            <div className="proposal-create-error">
              {error}
            </div>
          )}

          {/* 버튼 */}
          <div className="proposal-create-actions">
            <button
              type="button"
              className="proposal-cancel-btn"
              onClick={handleCancel}
              disabled={loading}
            >
              취소
            </button>

            <button
              type="submit"
              className="proposal-submit-btn"
              disabled={loading}
            >
              {loading ? "등록 중..." : "신조어 제안하기"}
            </button>
          </div>
        </form>

      </div>
    </main>
  );
}

export default ProposalCreate;