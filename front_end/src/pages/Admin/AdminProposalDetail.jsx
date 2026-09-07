import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getAdminProposal,
  updateAdminProposal,
  executeProposalAiReview,
  approveProposal,
  rejectProposal,
} from "../../api/adminProposalApi";
import "../../css/admin/AdminProposalDetail.css";

const STATUS_LABEL = {
  DISCUSSION: "토의 중",
  REVIEW_REQUESTED: "검수 요청",
  AI_REVIEWED: "AI 검수 완료",
  APPROVED: "승인",
  REJECTED: "반려",
};

const formatDate = (v) => {
  if (!v) return "-";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleString("ko-KR");
};

function ReviewValue({ label, value }) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "object") value = JSON.stringify(value);
  return (
    <div className="review-value">
      <span>{label}</span>
      <strong>{String(value)}</strong>
    </div>
  );
}

function AiReviewSection({ review }) {
  if (!review)
    return (
      <section className="admin-card">
        <h2>AI 검수 결과</h2>
        <p className="admin-muted">아직 AI 검수 결과가 없습니다.</p>
      </section>
    );
  return (
    <section className="admin-card">
      <div className="admin-card-title">
        <h2>AI 검수 결과</h2>
        <span>{formatDate(review.updatedAt)}</span>
      </div>
      {review.proposal && (
        <div className="review-block">
          <h3>제안 검수</h3>
          <ReviewValue label="중복" value={review.proposal.duplicate} />
          <ReviewValue
            label="추천 카테고리"
            value={review.proposal.recommendedCategory}
          />
          <ReviewValue
            label="추천 결과"
            value={review.proposal.recommendation}
          />
          <ReviewValue label="신뢰도" value={review.proposal.confidence} />
          <ReviewValue label="의견" value={review.proposal.opinion} />
        </div>
      )}
      {review.summary && (
        <div className="review-block">
          <h3>요약 검수</h3>
          <ReviewValue
            label="추천 결과"
            value={review.summary.recommendation}
          />
          <ReviewValue label="의견" value={review.summary.opinion} />
        </div>
      )}
    </section>
  );
}

export default function AdminProposalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getAdminProposal(id);
      setProposal(data);
      setForm({
        proposedWord: data?.proposedWord || "",
        meaning: data?.meaning || "",
        example: data?.example || "",
        description: data?.description || "",
        sourceDescription: data?.sourceDescription || "",
      });
    } catch (e) {
      console.error(e);
      setError(e.message || "제안 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const update = async () => {
    if (
      !form.proposedWord.trim() ||
      !form.meaning.trim() ||
      !form.example.trim()
    ) {
      alert("단어, 의미, 사용 예시는 필수입니다.");
      return;
    }
    try {
      setProcessing(true);
      await updateAdminProposal(id, {
        proposedWord: form.proposedWord.trim(),
        meaning: form.meaning.trim(),
        example: form.example.trim(),
        description: form.description.trim(),
        sourceDescription: form.sourceDescription.trim(),
      });
      await load();
      alert("제안 내용이 수정되었습니다.");
    } catch (e) {
      alert(e.message || "수정에 실패했습니다.");
    } finally {
      setProcessing(false);
    }
  };

  const aiReview = async () => {
    if (proposal.status !== "REVIEW_REQUESTED")
      return alert("검수 요청 상태에서만 AI 검수를 실행할 수 있습니다.");
    if (!window.confirm("AI 검수를 실행하시겠습니까?")) return;
    try {
      setProcessing(true);
      await executeProposalAiReview(id);
      await load();
      alert("AI 검수가 완료되었습니다.");
    } catch (e) {
      alert(e.message || "AI 검수에 실패했습니다.");
    } finally {
      setProcessing(false);
    }
  };

  const approve = async () => {
    if (!["REVIEW_REQUESTED", "AI_REVIEWED"].includes(proposal.status))
      return alert("검수 가능한 상태의 제안만 승인할 수 있습니다.");
    const category = window.prompt(
      "등록할 카테고리를 입력해 주세요.(예 : SNS, 일상, 게임, 인터넷 ...)",
      proposal.aiReview?.proposal?.recommendedCategory || "",
    );
    if (!category?.trim()) return;
    const era = window.prompt("시대를 입력해 주세요.(예 : 2020년대).", "");
    if (
      !window.confirm(
        `"${proposal.proposedWord}"을(를) 사전에 등록하시겠습니까?`,
      )
    )
      return;
    try {
      setProcessing(true);
      const saved = await approveProposal(id, {
        category: category.trim(),
        era: era?.trim() || null,
      });
      alert(
        `"${saved?.word || proposal.proposedWord}"이(가) 사전에 등록되었습니다.`,
      );
      await load();
    } catch (e) {
      alert(e.message || "승인에 실패했습니다.");
    } finally {
      setProcessing(false);
    }
  };

  const reject = async () => {
    if (!["REVIEW_REQUESTED", "AI_REVIEWED"].includes(proposal.status))
      return alert("검수 가능한 상태의 제안만 반려할 수 있습니다.");
    const reason = window.prompt(
      "반려 사유를 입력해 주세요.",
      proposal.rejectReason || "",
    );
    if (reason === null) return;
    if (!window.confirm("이 제안을 반려하시겠습니까?")) return;
    try {
      setProcessing(true);
      await rejectProposal(id, reason);
      await load();
      alert("제안이 반려되었습니다.");
    } catch (e) {
      alert(e.message || "반려에 실패했습니다.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading)
    return (
      <div className="admin-page">
        <div className="admin-loading">불러오는 중입니다...</div>
      </div>
    );
  if (error || !proposal || !form)
    return (
      <div className="admin-page">
        <div className="admin-error">{error || "제안을 찾을 수 없습니다."}</div>
        <button
          className="admin-secondary-button"
          onClick={() => navigate("/admin")}
        >
          목록으로
        </button>
      </div>
    );

  const canDecision = ["REVIEW_REQUESTED", "AI_REVIEWED"].includes(
    proposal.status,
  );

  return (
    <div className="admin-page">
      <header className="admin-detail-header">
        <button
          className="admin-back-button"
          onClick={() => navigate("/admin")}
        >
          ← 목록
        </button>
        <div>
          <p className="admin-eyebrow">PROPOSAL #{proposal.id}</p>
          <h1>{proposal.proposedWord}</h1>
        </div>
        <span
          className={`status-badge status-${(proposal.status || "").toLowerCase()}`}
        >
          {STATUS_LABEL[proposal.status] || proposal.status}
        </span>
      </header>

      <div className="admin-detail-grid">
        <main>
          <section className="admin-card">
            <div className="admin-card-title">
              <h2>제안 내용</h2>
              <span>{formatDate(proposal.updatedAt)}</span>
            </div>
            <div className="admin-form">
              {[
                ["proposedWord", "제안 단어", "input"],
                ["meaning", "의미", "textarea"],
                ["example", "사용 예시", "textarea"],
                ["description", "설명", "textarea"],
                ["sourceDescription", "출처 / 유래", "textarea"],
              ].map(([name, title, type]) => (
                <label key={name}>
                  <span>{title}</span>
                  {type === "input" ? (
                    <input
                      value={form[name]}
                      onChange={(e) => setField(name, e.target.value)}
                    />
                  ) : (
                    <textarea
                      rows={4}
                      value={form[name]}
                      onChange={(e) => setField(name, e.target.value)}
                    />
                  )}
                </label>
              ))}
              <button
                className="admin-primary-button"
                onClick={update}
                disabled={processing}
              >
                내용 저장
              </button>
            </div>
          </section>

          <AiReviewSection review={proposal.aiReview} />

          <section className="admin-card">
            <h2>댓글 ({proposal.comments?.length ?? 0})</h2>
            {!proposal.comments?.length ? (
              <p className="admin-muted">댓글이 없습니다.</p>
            ) : (
              <div className="admin-comments">
                {proposal.comments.map((c) => (
                  <div className="admin-comment" key={c.id}>
                    <div className="admin-comment-header">
                      <strong>{c.nickname || c.userNickname || "-"}</strong>
                      <span>{formatDate(c.createdAt)}</span>
                    </div>
                    <p>{c.content}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>

        <aside>
          <section className="admin-card admin-sticky">
            <h2>관리</h2>
            <div className="admin-stat-grid">
              <div>
                <span>추천</span>
                <strong>{proposal.likes ?? 0}</strong>
              </div>
              <div>
                <span>비추천</span>
                <strong>{proposal.dislikes ?? 0}</strong>
              </div>
              <div>
                <span>조회</span>
                <strong>{proposal.views ?? 0}</strong>
              </div>
              <div>
                <span>댓글</span>
                <strong>{proposal.commentCount ?? 0}</strong>
              </div>
            </div>
            <div className="admin-meta">
              <div>
                <span>작성자</span>
                <strong>
                  {proposal.nickname ||
                    proposal.userNickname ||
                    proposal.email ||
                    "-"}
                </strong>
              </div>
              <div>
                <span>등록일</span>
                <strong>{formatDate(proposal.createdAt)}</strong>
              </div>
              {proposal.rejectReason && (
                <div>
                  <span>반려 사유</span>
                  <strong>{proposal.rejectReason}</strong>
                </div>
              )}
            </div>
            <div className="admin-actions">
              {proposal.status === "REVIEW_REQUESTED" && (
                <button
                  className="admin-ai-button"
                  onClick={aiReview}
                  disabled={processing}
                >
                  AI 검수 실행
                </button>
              )}
              {canDecision && (
                <>
                  <button
                    className="admin-approve-button"
                    onClick={approve}
                    disabled={processing}
                  >
                    승인하여 사전에 등록
                  </button>
                  <button
                    className="admin-reject-button"
                    onClick={reject}
                    disabled={processing}
                  >
                    반려
                  </button>
                </>
              )}
              {!canDecision && proposal.status !== "REVIEW_REQUESTED" && (
                <div className="admin-notice">
                  현재 상태에서는 검수 처리를 할 수 없습니다.
                </div>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
