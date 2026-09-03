import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../../AuthContext";

import {
  createCandidate,
  createComment,
  createReply,
  deleteComment,
  deleteProposal,
  getProposal,
  updateComment,
} from "../../api/proposalApi";

import "../../css/proposal/ProposalDetail.css";

function ProposalDetail() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [comment, setComment] = useState("");
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyContent, setReplyContent] = useState("");

  const [candidateOpen, setCandidateOpen] = useState(false);
  const [candidate, setCandidate] = useState({
    word: "",
    meaning: "",
    example: "",
    description: "",
  });

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const isOwner = !!user && !!proposal && Number(user.id) === Number(proposal.userId);

  useEffect(() => {
    loadProposal();
  }, [id]);

  const loadProposal = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getProposal(id);
      setProposal(data);
    } catch (err) {
      console.error("신조어 제안 상세 조회 실패:", err);

      if (err.status === 404) {
        setError("존재하지 않는 신조어 제안입니다.");
      } else {
        setError(err.message || "신조어 제안을 불러오지 못했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "PENDING":
        return "검토 중";

      case "APPROVED":
        return "등록 완료";

      case "REJECTED":
        return "반려";

      default:
        return status || "검토 중";
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "APPROVED":
        return "approved";

      case "REJECTED":
        return "rejected";

      default:
        return "pending";
    }
  };

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(date).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // -----------------------------
  // 댓글 작성
  // -----------------------------
  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    if (!comment.trim()) {
      return;
    }

    try {
      setSubmitting(true);

      await createComment(id, {
        content: comment.trim(),
      });

      setComment("");

      await loadProposal();
    } catch (err) {
      console.error("댓글 작성 실패:", err);

      alert(err.message || "댓글을 작성하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // -----------------------------
  // 대댓글 작성
  // -----------------------------
  const handleReplySubmit = async (e) => {
    e.preventDefault();

    if (!replyContent.trim() || !replyTarget) {
      return;
    }

    try {
      setSubmitting(true);

      await createReply(id, replyTarget, {
        content: replyContent.trim(),
      });

      setReplyTarget(null);
      setReplyContent("");

      await loadProposal();
    } catch (err) {
      console.error("대댓글 작성 실패:", err);

      alert(err.message || "대댓글을 작성하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // -----------------------------
  // 댓글 삭제
  // -----------------------------
  const handleDeleteComment = async (commentId) => {
    const confirmed = window.confirm("댓글을 삭제하시겠습니까?");

    if (!confirmed) {
      return;
    }

    try {
      setSubmitting(true);

      await deleteComment(commentId);

      await loadProposal();
    } catch (err) {
      console.error("댓글 삭제 실패:", err);

      if (err.status === 403) {
        alert(err.message);
        return;
      }

      alert(err.message || "댓글을 삭제하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // -----------------------------
  // 댓글 수정 시작
  // -----------------------------
  const handleEditComment = (item) => {
    setEditingCommentId(item.id);
    setEditingContent(item.content);
  };

  // -----------------------------
  // 댓글 수정 취소
  // -----------------------------
  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditingContent("");
  };

  // -----------------------------
  // 댓글 수정 저장
  // -----------------------------
  const handleUpdateComment = async (commentId) => {
    if (!editingContent.trim()) {
      return;
    }

    try {
      setSubmitting(true);

      await updateComment(commentId, {
        content: editingContent.trim(),
      });

      setEditingCommentId(null);
      setEditingContent("");

      await loadProposal();
    } catch (err) {
      console.error("댓글 수정 실패:", err);

      if (err.status === 403) {
        alert(err.message);
        return;
      }

      alert(err.message || "댓글을 수정하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // -----------------------------
  // 후보 신조어 입력
  // -----------------------------
  const handleCandidateChange = (e) => {
    const { name, value } = e.target;

    setCandidate((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // -----------------------------
  // 후보 신조어 등록
  // -----------------------------
  const handleCandidateSubmit = async (e) => {
    e.preventDefault();

    if (!candidate.word.trim()) {
      alert("후보 신조어를 입력해주세요.");
      return;
    }

    if (!candidate.meaning.trim()) {
      alert("후보 신조어의 의미를 입력해주세요.");
      return;
    }

    try {
      setSubmitting(true);

      await createCandidate(id, {
        word: candidate.word.trim(),
        meaning: candidate.meaning.trim(),
        example: candidate.example.trim(),
        description: candidate.description.trim(),
      });

      setCandidate({
        word: "",
        meaning: "",
        example: "",
        description: "",
      });

      setCandidateOpen(false);

      await loadProposal();
    } catch (err) {
      console.error("후보 신조어 등록 실패:", err);

      alert(err.message || "후보 신조어를 등록하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // -----------------------------
  // 제안 삭제
  // -----------------------------
  const handleDeleteProposal = async () => {
    if (!window.confirm("이 제안을 삭제하시겠습니까?")) {
      return;
    }

    try {
      await deleteProposal(id);
      navigate("/proposals");
    } catch (err) {
      if (err.status === 403) {
        alert(err.message);
        return;
      }

      alert(err.message || "제안 삭제에 실패했습니다.");
    }
  };

  // -----------------------------
  // 댓글 렌더링
  // -----------------------------
  const renderComment = (item, isReply = false) => {
    const isCommentOwner = !!user && Number(user.id) === Number(item.userId);

    return (
      <div
        key={item.id}
        className={`proposal-comment ${
          isReply ? "proposal-comment-reply" : ""
        }`}
      >
        <div className="proposal-comment-header">
          <strong>{item.nickname}</strong>

          <span>{formatDate(item.createdAt)}</span>
        </div>

        {editingCommentId === item.id ? (
          <div className="proposal-comment-edit">
            <textarea
              value={editingContent}
              onChange={(e) => setEditingContent(e.target.value)}
              rows={3}
              disabled={submitting}
            />

            <div className="proposal-comment-edit-actions">
              <button
                type="button"
                onClick={handleCancelEditComment}
                disabled={submitting}
              >
                취소
              </button>

              <button
                type="button"
                onClick={() => handleUpdateComment(item.id)}
                disabled={submitting || !editingContent.trim()}
              >
                저장
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="proposal-comment-content">{item.content}</p>

            <div className="proposal-comment-actions">
              {!isReply && user && (
                <button type="button" onClick={() => setReplyTarget(item.id)}>
                  답글
                </button>
              )}

              {isCommentOwner && (
                <>
                  <button type="button" onClick={() => handleEditComment(item)}>
                    수정
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteComment(item.id)}
                    disabled={submitting}
                  >
                    삭제
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {!isReply && item.replies && item.replies.length > 0 && (
          <div className="proposal-replies">
            {item.replies.map((reply) => renderComment(reply, true))}
          </div>
        )}

        {!isReply && user && replyTarget === item.id && (
          <form className="proposal-reply-form" onSubmit={handleReplySubmit}>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="답글을 작성해주세요."
              rows={3}
              disabled={submitting}
            />

            <div>
              <button
                type="button"
                onClick={() => {
                  setReplyTarget(null);
                  setReplyContent("");
                }}
                disabled={submitting}
              >
                취소
              </button>

              <button
                type="submit"
                disabled={submitting || !replyContent.trim()}
              >
                답글 작성
              </button>
            </div>
          </form>
        )}
      </div>
    );
  };

  // -----------------------------
  // 로딩
  // -----------------------------
  if (loading) {
    return (
      <main className="proposal-detail">
        <div className="proposal-detail-inner">
          <div className="proposal-detail-loading">
            신조어 제안을 불러오는 중입니다...
          </div>
        </div>
      </main>
    );
  }

  // -----------------------------
  // 오류
  // -----------------------------
  if (error || !proposal) {
    return (
      <main className="proposal-detail">
        <div className="proposal-detail-inner">
          <div className="proposal-detail-error">
            <h2>제안을 찾을 수 없습니다.</h2>

            <p>{error || "존재하지 않는 신조어 제안입니다."}</p>

            <Link to="/proposals">제안 목록으로 돌아가기</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="proposal-detail">
      <div className="proposal-detail-inner">
        {/* 상단 뒤로가기 */}
        <Link to="/proposals" className="proposal-back">
          ← 신조어 제안 목록
        </Link>

        {/* 제안 내용 */}
        <section className="proposal-detail-card">
          <div className="proposal-detail-top">
            <span
              className={`proposal-status ${getStatusClass(proposal.status)}`}
            >
              {getStatusLabel(proposal.status)}
            </span>

            <div className="proposal-detail-meta">
              조회 {proposal.views ?? 0}
              <span>·</span>
              좋아요 {proposal.likes ?? 0}
            </div>
          </div>

          <h1>{proposal.proposedWord}</h1>

          <div className="proposal-detail-author">
            <strong>{proposal.nickname}</strong>

            <span>{formatDate(proposal.createdAt)}</span>
          </div>

          <div className="proposal-detail-section">
            <h2>의미</h2>

            <p>{proposal.meaning}</p>
          </div>

          <div className="proposal-detail-section">
            <h2>사용 예시</h2>

            <div className="proposal-example">{proposal.example}</div>
          </div>

          {proposal.description && (
            <div className="proposal-detail-section">
              <h2>상세 설명</h2>

              <p className="proposal-detail-text">{proposal.description}</p>
            </div>
          )}

          {proposal.sourceDescription && (
            <div className="proposal-detail-section">
              <h2>출처 / 유래</h2>

              <p className="proposal-detail-text">
                {proposal.sourceDescription}
              </p>
            </div>
          )}

          <div className="proposal-detail-footer">
            <span>수정일 {formatDate(proposal.updatedAt)}</span>

            {isOwner && proposal.status === "DISCUSSION" && (
              <>
                <button
                  onClick={() => navigate(`/proposals/${proposal.id}/edit`)}
                >
                  수정
                </button>

                <button onClick={handleDeleteProposal}>삭제</button>
              </>
            )}
          </div>
        </section>

        {/* 후보 신조어 */}
        <section className="proposal-section-card">
          <div className="proposal-section-header">
            <div>
              <h2>후보 신조어</h2>

              <p>이 제안에서 파생되거나 함께 제안된 새로운 표현입니다.</p>
            </div>

            {/* 로그인 사용자만 후보 제안 가능 */}
            {user && (
              <button
                type="button"
                className="proposal-section-button"
                onClick={() => setCandidateOpen((prev) => !prev)}
              >
                + 후보 제안
              </button>
            )}
          </div>

          {candidateOpen && (
            <form className="candidate-form" onSubmit={handleCandidateSubmit}>
              <div className="candidate-form-group">
                <label htmlFor="candidate-word">후보 신조어 *</label>

                <input
                  id="candidate-word"
                  name="word"
                  value={candidate.word}
                  onChange={handleCandidateChange}
                  placeholder="후보 신조어를 입력해주세요."
                  disabled={submitting}
                />
              </div>

              <div className="candidate-form-group">
                <label htmlFor="candidate-meaning">의미 *</label>

                <textarea
                  id="candidate-meaning"
                  name="meaning"
                  value={candidate.meaning}
                  onChange={handleCandidateChange}
                  placeholder="의미를 입력해주세요."
                  rows={3}
                  disabled={submitting}
                />
              </div>

              <div className="candidate-form-group">
                <label htmlFor="candidate-example">사용 예시</label>

                <textarea
                  id="candidate-example"
                  name="example"
                  value={candidate.example}
                  onChange={handleCandidateChange}
                  placeholder="사용 예시를 입력해주세요."
                  rows={3}
                  disabled={submitting}
                />
              </div>

              <div className="candidate-form-group">
                <label htmlFor="candidate-description">설명</label>

                <textarea
                  id="candidate-description"
                  name="description"
                  value={candidate.description}
                  onChange={handleCandidateChange}
                  placeholder="추가 설명을 입력해주세요."
                  rows={3}
                  disabled={submitting}
                />
              </div>

              <div className="candidate-form-actions">
                <button
                  type="button"
                  onClick={() => setCandidateOpen(false)}
                  disabled={submitting}
                >
                  취소
                </button>

                <button type="submit" disabled={submitting}>
                  후보 신조어 등록
                </button>
              </div>
            </form>
          )}

          {proposal.candidates && proposal.candidates.length > 0 ? (
            <div className="candidate-list">
              {proposal.candidates.map((item) => (
                <div key={item.id} className="candidate-item">
                  <div className="candidate-item-top">
                    <h3>{item.word}</h3>

                    <span
                      className={`proposal-status ${getStatusClass(
                        item.status,
                      )}`}
                    >
                      {getStatusLabel(item.status)}
                    </span>
                  </div>

                  <p className="candidate-meaning">{item.meaning}</p>

                  {item.example && (
                    <p className="candidate-example">“{item.example}”</p>
                  )}

                  <div className="candidate-meta">
                    {item.nickname}
                    <span>·</span>
                    좋아요 {item.likes ?? 0}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="proposal-section-empty">
              아직 등록된 후보 신조어가 없습니다.
            </div>
          )}
        </section>

        {/* 댓글 */}
        <section className="proposal-section-card">
          <div className="proposal-section-header">
            <div>
              <h2>
                댓글{" "}
                <span className="proposal-comment-count">
                  {proposal.commentCount ?? 0}
                </span>
              </h2>

              <p>신조어에 대한 의견을 자유롭게 남겨주세요.</p>
            </div>
          </div>

          {/* 로그인 사용자만 댓글 작성 가능 */}
          {user ? (
            <form
              className="proposal-comment-form"
              onSubmit={handleCommentSubmit}
            >
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="이 신조어에 대한 의견을 작성해주세요."
                rows={4}
                disabled={submitting}
              />

              <div className="proposal-comment-form-footer">
                <span>다른 사용자들과 서로 존중하며 의견을 나눠주세요.</span>

                <button type="submit" disabled={submitting || !comment.trim()}>
                  댓글 작성
                </button>
              </div>
            </form>
          ) : (
            <div className="proposal-login-notice">
              댓글을 작성하려면 <Link to="/login">로그인</Link>
              해주세요.
            </div>
          )}

          <div className="proposal-comments">
            {proposal.comments && proposal.comments.length > 0 ? (
              proposal.comments.map((item) => renderComment(item))
            ) : (
              <div className="proposal-section-empty">
                아직 댓글이 없습니다. 첫 번째 의견을 남겨보세요.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default ProposalDetail;
