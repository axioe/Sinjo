import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../../AuthContext";

import {
  createComment,
  deleteComment,
  deleteProposal,
  getProposal,
  updateComment,
  voteProposal,
} from "../../api/proposalApi";

import "../../css/proposal/ProposalDetail.css";

import { ThumbsUp, ThumbsDown } from "lucide-react";

function ProposalDetail() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [comment, setComment] = useState("");

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const isOwner =
    !!user && !!proposal && Number(user.id) === Number(proposal.userId);

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
      } else if (err.status === 401) {
        setError("로그인이 필요한 기능입니다.");
      } else {
        setError(err.message || "신조어 제안을 불러오지 못했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "DISCUSSION":
        return "의견 수렴 중";

      case "REVIEW_REQUESTED":
        return "관리자 검수 대기";

      case "AI_REVIEWED":
        return "AI 검수 완료";

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
      case "DISCUSSION":
        return "discussion";

      case "REVIEW_REQUESTED":
        return "review-requested";

      case "AI_REVIEWED":
        return "ai-reviewed";

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

  // ---------------------------------------------------------
  // 댓글 작성
  // ---------------------------------------------------------

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
      window.alert(err.message || "댓글을 작성하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------
  // 댓글 삭제
  // ---------------------------------------------------------

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) {
      return;
    }

    try {
      setSubmitting(true);

      await deleteComment(commentId);

      await loadProposal();
    } catch (err) {
      console.error("댓글 삭제 실패:", err);

      if (err.status === 403) {
        window.alert(err.message || "댓글을 삭제할 권한이 없습니다.");
        return;
      }

      window.alert(err.message || "댓글을 삭제하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------
  // 댓글 수정 시작
  // ---------------------------------------------------------

  const handleEditComment = (item) => {
    setEditingCommentId(item.id);
    setEditingContent(item.content);
  };

  // ---------------------------------------------------------
  // 댓글 수정 취소
  // ---------------------------------------------------------

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditingContent("");
  };

  // ---------------------------------------------------------
  // 댓글 수정 저장
  // ---------------------------------------------------------

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
        window.alert(err.message || "댓글을 수정할 권한이 없습니다.");
        return;
      }

      window.alert(err.message || "댓글을 수정하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------
  // 제안 삭제
  // ---------------------------------------------------------

  const handleDeleteProposal = async () => {
    if (!window.confirm("이 제안을 삭제하시겠습니까?")) {
      return;
    }

    try {
      await deleteProposal(id);
      navigate("/proposals");
    } catch (err) {
      console.error("제안 삭제 실패:", err);

      if (err.status === 403) {
        window.alert(err.message || "이 제안을 삭제할 권한이 없습니다.");
        return;
      }

      window.alert(err.message || "제안 삭제에 실패했습니다.");
    }
  };

  // ---------------------------------------------------------
  // 제안 투표
  // ---------------------------------------------------------

  const handleVote = async (type) => {
    if (!user) {
      window.alert("투표하려면 로그인이 필요합니다.");
      return;
    }

    if (isOwner) {
      window.alert("자신이 작성한 제안에는 투표할 수 없습니다.");
      return;
    }

    if (proposal.status !== "DISCUSSION") {
      window.alert("현재 투표할 수 없는 제안입니다.");
      return;
    }

    try {
      setSubmitting(true);

      await voteProposal(proposal.id, type);

      // 서버에서 likes / dislikes를 다시 조회
      await loadProposal();
    } catch (err) {
      console.error("제안 투표 실패:", err);

      window.alert(err.message || "투표 처리에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------
  // 댓글 렌더링
  // 대댓글 기능 제거
  // ---------------------------------------------------------

  const renderComment = (item) => {
    const isCommentOwner = !!user && Number(user.id) === Number(item.userId);

    return (
      <div key={item.id} className="proposal-comment">
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
      </div>
    );
  };

  // ---------------------------------------------------------
  // 로딩
  // ---------------------------------------------------------

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

  // ---------------------------------------------------------
  // 오류
  // ---------------------------------------------------------

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

  const canVote = !!user && !isOwner && proposal.status === "DISCUSSION";

  return (
    <main className="proposal-detail">
      <div className="proposal-detail-inner">
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
              댓글 {proposal.commentCount ?? 0}
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

          {/* 투표 */}
          {/* 투표 */}
          {proposal.status === "DISCUSSION" && (
            <div className="proposal-vote-box">
              <div className="proposal-vote-counts">
                <span className="proposal-like-count">
                  <ThumbsUp className="vote-count-icon" />
                  {proposal.likes ?? 0}
                </span>

                <span className="proposal-dislike-count">
                  <ThumbsDown className="vote-count-icon" />
                  {proposal.dislikes ?? 0}
                </span>
              </div>

              {isOwner ? (
                <p className="proposal-vote-notice">
                  자신의 제안에는 투표할 수 없습니다.
                </p>
              ) : user ? (
                <div className="proposal-vote-actions">
                  <button
                    type="button"
                    disabled={!canVote || submitting}
                    className="proposal-like-btn"
                    onClick={() => handleVote("LIKE")}
                  >
                    <ThumbsUp className="vote-icon" />
                    <span>좋아요</span>
                  </button>

                  <button
                    type="button"
                    disabled={!canVote || submitting}
                    className="proposal-dislike-btn"
                    onClick={() => handleVote("DISLIKE")}
                  >
                    <ThumbsDown className="vote-icon" />
                    <span>싫어요</span>
                  </button>
                </div>
              ) : (
                <p className="proposal-vote-notice">
                  투표하려면 로그인이 필요합니다.
                </p>
              )}
            </div>
          )}

          <div className="proposal-detail-footer">
            <span>수정일 {formatDate(proposal.updatedAt)}</span>

            {isOwner && proposal.status === "DISCUSSION" && (
              <>
                <button
                  type="button"
                  onClick={() => navigate(`/proposals/${proposal.id}/edit`)}
                >
                  수정
                </button>

                <button type="button" onClick={handleDeleteProposal}>
                  삭제
                </button>
              </>
            )}
          </div>
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
              proposal.comments.map(renderComment)
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
