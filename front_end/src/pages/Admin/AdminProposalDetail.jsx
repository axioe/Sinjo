import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  getAdminProposal,
  requestProposalReview,
  executeProposalAiReview,
  approveProposal,
  rejectProposal,
} from "../../api/adminProposalApi";

import "../../css/admin/AdminProposal.css";

const STATUS_LABEL = {
  DISCUSSION: "토의 중",
  REVIEW_REQUESTED: "검수 요청",
  AI_REVIEWED: "AI 검수 완료",
  APPROVED: "승인",
  REJECTED: "반려",
};

export default function AdminProposalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  const [candidateId, setCandidateId] = useState(null);
  const [category, setCategory] = useState("");
  const [era, setEra] = useState("");

  const loadProposal = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAdminProposal(id);

      setProposal(data);

      // 승인 가능한 PENDING 후보를 기본 선택
      const pendingCandidate = data?.candidates?.find(
        (candidate) => candidate.status === "AI_REVIEWED",
      );

      if (pendingCandidate) {
        setCandidateId(pendingCandidate.id);
      } else {
        setCandidateId(null);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "제안 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProposal();
  }, [id]);

  const handleRequestReview = async () => {
    try {
      setProcessing(true);

      await requestProposalReview(id);
      await loadProposal();

      alert("AI 검수 요청 상태로 변경되었습니다.");
    } catch (err) {
      alert(err.message || "검수 요청에 실패했습니다.");
    } finally {
      setProcessing(false);
    }
  };

  const handleAiReview = async () => {
    if (!window.confirm("AI 검수를 실행하시겠습니까?")) {
      return;
    }

    try {
      setProcessing(true);

      await executeProposalAiReview(id);
      await loadProposal();

      alert("AI 검수가 완료되었습니다.");
    } catch (err) {
      alert(err.message || "AI 검수에 실패했습니다.");
    } finally {
      setProcessing(false);
    }
  };

  const handleApprove = async () => {
    if (!candidateId) {
      alert("승인할 후보를 선택해 주세요.");
      return;
    }

    if (!category.trim()) {
      alert("카테고리를 입력해 주세요.");
      return;
    }

    if (!window.confirm("선택한 후보를 실제 신조어 사전에 등록하시겠습니까?")) {
      return;
    }

    try {
      setProcessing(true);

      const savedWord = await approveProposal(id, {
        candidateId,
        category: category.trim(),
        era: era.trim() || null,
      });

      alert(`"${savedWord?.word ?? "신조어"}"이(가) 사전에 등록되었습니다.`);

      navigate("/admin");
    } catch (err) {
      alert(err.message || "승인에 실패했습니다.");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm("이 제안을 반려하시겠습니까?")) {
      return;
    }

    try {
      setProcessing(true);

      await rejectProposal(id);
      await loadProposal();

      alert("제안이 반려되었습니다.");
    } catch (err) {
      alert(err.message || "반려에 실패했습니다.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-loading">불러오는 중입니다...</div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="admin-page">
        <div className="admin-error">{error || "제안을 찾을 수 없습니다."}</div>

        <button
          type="button"
          className="admin-proposal-back-button"
          onClick={() => navigate("/admin")}
        >
          목록으로
        </button>
      </div>
    );
  }

  const canRequestReview = proposal.status === "DISCUSSION";
  const canExecuteAiReview = proposal.status === "REVIEW_REQUESTED";
  const canApprove = proposal.status === "AI_REVIEWED";

  return (
    <div className="admin-page admin-proposal-detail">
      {/* 헤더 */}
      <div className="admin-proposal-detail-header">
        <button
          type="button"
          onClick={() => navigate("/admin")}
          className="admin-proposal-back-button"
        >
          ← 목록
        </button>

        <div className="admin-proposal-detail-title">
          <div className="admin-proposal-title-row">
            <h1>{proposal.proposedWord}</h1>
            <StatusBadge status={proposal.status} />
          </div>

          <p className="admin-proposal-detail-meta">
            작성자: {proposal.nickname || "-"}
            {" · "}
            등록일: {formatDate(proposal.createdAt)}
          </p>
        </div>
      </div>

      {/* 제안 내용 */}
      <section className="admin-proposal-card">
        <h2>제안 내용</h2>

        <dl className="admin-proposal-detail-list">
          <DetailItem label="신조어" value={proposal.proposedWord} />
          <DetailItem label="의미" value={proposal.meaning} />
          <DetailItem label="예문" value={proposal.example} />
          <DetailItem label="설명" value={proposal.description} />
          <DetailItem label="출처" value={proposal.sourceDescription} />
        </dl>
      </section>

      {/* 관리자 액션 */}
      <section className="admin-proposal-card">
        <div className="admin-proposal-section-heading">
          <div>
            <h2>검수 관리</h2>
            <p>현재 상태에 맞는 작업을 진행할 수 있습니다.</p>
          </div>

          <StatusBadge status={proposal.status} />
        </div>

        <div className="admin-proposal-actions">
          {canRequestReview && (
            <button
              type="button"
              onClick={handleRequestReview}
              disabled={processing}
              className="admin-proposal-primary-button"
            >
              {processing ? "처리 중..." : "AI 검수 요청"}
            </button>
          )}

          {canExecuteAiReview && (
            <button
              type="button"
              onClick={handleAiReview}
              disabled={processing}
              className="admin-proposal-primary-button"
            >
              {processing ? "검수 중..." : "AI 검수 실행"}
            </button>
          )}

          {canApprove && (
            <>
              <button
                type="button"
                onClick={handleApprove}
                disabled={processing}
                className="admin-proposal-approve-button"
              >
                {processing ? "처리 중..." : "승인 및 사전 등록"}
              </button>

              <button
                type="button"
                onClick={handleReject}
                disabled={processing}
                className="admin-proposal-reject-button"
              >
                반려
              </button>
            </>
          )}
        </div>
      </section>

      {/* 후보 */}
      <section className="admin-proposal-card">
        <div className="admin-proposal-section-heading">
          <div>
            <h2>후보 신조어</h2>
            <p>
              {canApprove
                ? "사전에 등록할 후보를 하나 선택하세요."
                : "등록된 후보를 확인할 수 있습니다."}
            </p>
          </div>
        </div>

        {!proposal.candidates?.length ? (
          <p className="admin-proposal-empty">등록된 후보가 없습니다.</p>
        ) : (
          <div className="admin-proposal-candidates">
            {proposal.candidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                selected={candidateId === candidate.id}
                selectable={canApprove && candidate.status === "AI_REVIEWED"}
                onSelect={() => setCandidateId(candidate.id)}
              />
            ))}
          </div>
        )}

        {canApprove && (
          <div className="admin-proposal-approve-form">
            <div className="admin-proposal-form-row">
              <label htmlFor="proposal-category">카테고리</label>

              <input
                id="proposal-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="예: 인터넷, 일상, 사회"
              />
            </div>

            <div className="admin-proposal-form-row">
              <label htmlFor="proposal-era">시대</label>

              <input
                id="proposal-era"
                value={era}
                onChange={(e) => setEra(e.target.value)}
                placeholder="예: 2020년대"
              />
            </div>
          </div>
        )}
      </section>

      {/* AI 검수 */}
      <AiReviewSection review={proposal.aiReview} />

      {/* 댓글 */}
      <section className="admin-proposal-card">
        <div className="admin-proposal-section-heading">
          <div>
            <h2>댓글 ({proposal.comments?.length ?? 0})</h2>
          </div>
        </div>

        {!proposal.comments?.length ? (
          <p className="admin-proposal-empty">댓글이 없습니다.</p>
        ) : (
          <div className="admin-proposal-comments">
            {proposal.comments.map((comment) => (
              <div key={comment.id} className="admin-proposal-comment">
                <div className="admin-proposal-comment-header">
                  <strong>{comment.nickname || "-"}</strong>
                  <span>{formatDate(comment.createdAt)}</span>
                </div>

                <p>{comment.content}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CandidateCard({ candidate, selected, selectable, onSelect }) {
  return (
    <div
      className={[
        "admin-proposal-candidate",
        selected ? "selected" : "",
        !selectable ? "disabled" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={() => {
        if (selectable) {
          onSelect();
        }
      }}
    >
      {selectable && (
        <input
          type="radio"
          name="proposal-candidate"
          checked={selected}
          onChange={onSelect}
          onClick={(e) => e.stopPropagation()}
        />
      )}

      <div className="admin-proposal-candidate-content">
        <div className="admin-proposal-candidate-title">
          <h3>{candidate.word}</h3>

          <span
            className={`admin-proposal-candidate-status status-${candidate.status}`}
          >
            {candidate.status}
          </span>
        </div>

        <p>
          <strong>의미</strong>
          {candidate.meaning || "-"}
        </p>

        <p>
          <strong>예문</strong>
          {candidate.example || "-"}
        </p>

        {candidate.description && (
          <p>
            <strong>설명</strong>
            {candidate.description}
          </p>
        )}

        <div className="admin-proposal-candidate-meta">
          댓글 작성자: {candidate.nickname || "-"}
          {" · "}
          추천: {candidate.likes ?? 0}
        </div>
      </div>
    </div>
  );
}

function AiReviewSection({ review }) {
  if (!review) {
    return (
      <section className="admin-proposal-card">
        <div className="admin-proposal-section-heading">
          <div>
            <h2>AI 검수 결과</h2>
          </div>
        </div>

        <p className="admin-proposal-empty">아직 AI 검수 결과가 없습니다.</p>
      </section>
    );
  }

  return (
    <section className="admin-proposal-card">
      <div className="admin-proposal-section-heading">
        <div>
          <h2>AI 검수 결과</h2>
          <p>AI가 분석한 제안 및 후보 검수 결과입니다.</p>
        </div>
      </div>

      {review.proposal && (
        <div className="admin-proposal-ai-block">
          <h3>제안 검수</h3>

          <ReviewValue label="중복" value={review.proposal.duplicate} />

          <ReviewValue
            label="추천 카테고리"
            value={review.proposal.recommendedCategory}
          />

          <ReviewValue label="추천" value={review.proposal.recommendation} />

          <ReviewValue label="신뢰도" value={review.proposal.confidence} />

          <ReviewValue label="의견" value={review.proposal.opinion} />
        </div>
      )}

      {review.candidates?.length > 0 && (
        <div className="admin-proposal-ai-block">
          <h3>후보 검수</h3>

          {review.candidates.map((candidate) => (
            <div
              key={candidate.candidateId}
              className="admin-proposal-ai-candidate"
            >
              <h4>후보 #{candidate.candidateId}</h4>

              <ReviewValue label="중복" value={candidate.duplicate} />

              <ReviewValue label="추천" value={candidate.recommendation} />

              <ReviewValue label="신뢰도" value={candidate.confidence} />

              <ReviewValue label="의견" value={candidate.opinion} />
            </div>
          ))}
        </div>
      )}

      {review.summary && (
        <div className="admin-proposal-ai-block">
          <h3>종합 의견</h3>

          <ReviewValue label="추천" value={review.summary.recommendation} />

          <ReviewValue label="의견" value={review.summary.opinion} />
        </div>
      )}
    </section>
  );
}

function ReviewValue({ label, value }) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return (
    <div className="admin-proposal-review-value">
      <span>{label}</span>
      <strong>{String(value)}</strong>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="admin-proposal-detail-item">
      <dt>{label}</dt>
      <dd>{value || "-"}</dd>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`admin-proposal-status status-${status}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("ko-KR");
}
