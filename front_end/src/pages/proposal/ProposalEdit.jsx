import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../../AuthContext";

import {
  getProposal,
  updateProposal,
} from "../../api/proposalApi";

import "../../css/proposal/ProposalEdit.css";

function ProposalEdit() {
  const { user, loading: authLoading } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    proposedWord: "",
    meaning: "",
    example: "",
    description: "",
    sourceDescription: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    loadProposal();
  }, [id, user, authLoading]);

  const loadProposal = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getProposal(id);

      // 작성자 본인인지 확인
      if (Number(user.id) !== Number(data.userId)) {
        setError("이 제안을 수정할 권한이 없습니다.");
        return;
      }

      setProposal(data);

      setForm({
        proposedWord: data.proposedWord ?? "",
        meaning: data.meaning ?? "",
        example: data.example ?? "",
        description: data.description ?? "",
        sourceDescription: data.sourceDescription ?? "",
      });
    } catch (err) {
      console.error("신조어 제안 조회 실패:", err);

      if (err.status === 404) {
        setError("존재하지 않는 신조어 제안입니다.");
      } else {
        setError(
          err.message ||
            "신조어 제안을 불러오지 못했습니다."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: undefined,
      form: undefined,
    }));
  };

  const validate = () => {
    const found = {};

    if (!form.proposedWord.trim()) {
      found.proposedWord =
        "제안할 신조어를 입력해 주세요.";
    }

    if (!form.meaning.trim()) {
      found.meaning =
        "신조어의 의미를 입력해 주세요.";
    }

    if (!form.example.trim()) {
      found.example =
        "사용 예시를 입력해 주세요.";
    }

    setErrors(found);

    return Object.keys(found).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setSubmitting(true);

      const result = await updateProposal(id, {
        proposedWord: form.proposedWord.trim(),
        meaning: form.meaning.trim(),
        example: form.example.trim(),
        description: form.description.trim(),
        sourceDescription:
          form.sourceDescription.trim(),
      });

      navigate(`/proposals/${result.id}`, {
        replace: true,
      });
    } catch (err) {
      console.error("신조어 제안 수정 실패:", err);

      if (err.status === 403) {
        setErrors({
          form: "이 제안을 수정할 권한이 없습니다.",
        });
      } else {
        setErrors({
          form:
            err.message ||
            "신조어 제안을 수정하지 못했습니다.",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <main className="proposal-edit">
        <div className="proposal-edit-inner">
          <div className="proposal-edit-loading">
            신조어 제안을 불러오는 중입니다...
          </div>
        </div>
      </main>
    );
  }

  if (error || !proposal) {
    return (
      <main className="proposal-edit">
        <div className="proposal-edit-inner">
          <div className="proposal-edit-error">
            <h2>수정할 수 없습니다.</h2>

            <p>
              {error ||
                "신조어 제안을 불러오지 못했습니다."}
            </p>

            <Link to={`/proposals/${id}`}>
              제안 상세로 돌아가기
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="proposal-edit">
      <div className="proposal-edit-inner">
        <Link
          to={`/proposals/${id}`}
          className="proposal-edit-back"
        >
          ← 제안 상세로 돌아가기
        </Link>

        <section className="proposal-edit-card">
          <div className="proposal-edit-header">
            <h1>신조어 제안 수정</h1>

            <p>
              등록한 신조어 제안의 내용을 수정할 수
              있습니다.
            </p>
          </div>

          {errors.form && (
            <div className="proposal-edit-form-error">
              {errors.form}
            </div>
          )}

          <form
            className="proposal-edit-form"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="proposal-edit-field">
              <label htmlFor="proposedWord">
                제안할 신조어 *
              </label>

              <input
                id="proposedWord"
                name="proposedWord"
                type="text"
                value={form.proposedWord}
                onChange={handleChange}
                placeholder="예: 갓생"
                disabled={submitting}
              />

              {errors.proposedWord && (
                <p className="proposal-edit-error-text">
                  {errors.proposedWord}
                </p>
              )}
            </div>

            <div className="proposal-edit-field">
              <label htmlFor="meaning">
                의미 *
              </label>

              <textarea
                id="meaning"
                name="meaning"
                value={form.meaning}
                onChange={handleChange}
                placeholder="신조어의 의미를 입력해주세요."
                rows={4}
                disabled={submitting}
              />

              {errors.meaning && (
                <p className="proposal-edit-error-text">
                  {errors.meaning}
                </p>
              )}
            </div>

            <div className="proposal-edit-field">
              <label htmlFor="example">
                사용 예시 *
              </label>

              <textarea
                id="example"
                name="example"
                value={form.example}
                onChange={handleChange}
                placeholder="실제 사용 예시를 입력해주세요."
                rows={4}
                disabled={submitting}
              />

              {errors.example && (
                <p className="proposal-edit-error-text">
                  {errors.example}
                </p>
              )}
            </div>

            <div className="proposal-edit-field">
              <label htmlFor="description">
                상세 설명
              </label>

              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="신조어에 대한 추가 설명을 입력해주세요."
                rows={5}
                disabled={submitting}
              />
            </div>

            <div className="proposal-edit-field">
              <label htmlFor="sourceDescription">
                출처 / 유래
              </label>

              <textarea
                id="sourceDescription"
                name="sourceDescription"
                value={form.sourceDescription}
                onChange={handleChange}
                placeholder="신조어가 생겨난 배경이나 출처를 입력해주세요."
                rows={5}
                disabled={submitting}
              />
            </div>

            <div className="proposal-edit-actions">
              <Link
                to={`/proposals/${id}`}
                className="proposal-edit-cancel"
              >
                취소
              </Link>

              <button
                type="submit"
                className="proposal-edit-submit"
                disabled={submitting}
              >
                {submitting
                  ? "수정 중..."
                  : "수정 완료"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

export default ProposalEdit;