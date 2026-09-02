import { useEffect, useState } from "react";
import { FaCopy, FaRegStar, FaStar, FaTrash, FaTimes } from "react-icons/fa";

function RecentTranslations({
  items = [],
  loading = false,
  onToggleFavorite,
  onDelete,
}) {
  const [selectedItem, setSelectedItem] = useState(null);

  if (loading) {
    return (
      <section className="mypage-card mypage-translation-card">
        <div className="mypage-card-head">
          <div>
            <span className="mypage-card-eyebrow">RECENT TRANSLATIONS</span>

            <h2 className="mypage-card-title">최근 번역</h2>
          </div>
        </div>

        <div className="mypage-translation-loading">
          번역 기록을 불러오는 중입니다...
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="mypage-card mypage-translation-card">
        <div className="mypage-card-head">
          <div>
            <span className="mypage-card-eyebrow">RECENT TRANSLATIONS</span>

            <h2 className="mypage-card-title">최근 번역</h2>
          </div>

          <span className="mypage-translation-count">{items.length}개</span>
        </div>

        {items.length === 0 ? (
          <div className="mypage-empty">아직 번역 기록이 없습니다.</div>
        ) : (
          <ul className="mypage-translation-list">
            {items.map((item) => {
              const source = item.sourceText ?? item.source ?? item.text ?? "";

              const result =
                item.translatedText ?? item.result ?? item.translation ?? "";

              const sourceLanguage =
                item.sourceLanguage ?? item.fromLanguage ?? "원문";

              const targetLanguage =
                item.targetLanguage ?? item.toLanguage ?? "번역";

              return (
                <li
                  key={item.id}
                  className="mypage-translation"
                  onClick={() => setSelectedItem(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedItem(item);
                    }
                  }}
                >
                  <div className="mypage-translation-content">
                    <div className="mypage-translation-top">
                      <div className="mypage-translation-language">
                        <span>{sourceLanguage}</span>
                        <span className="mypage-translation-language-arrow">
                          →
                        </span>
                        <span>{targetLanguage}</span>
                      </div>

                      <span className="mypage-translation-date">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString("ko-KR")
                          : ""}
                      </span>
                    </div>

                    <div className="mypage-translation-row">
                      <p className="mypage-translation-source">
                        {source || "원문 없음"}
                      </p>

                      <span className="mypage-translation-arrow">→</span>

                      <p className="mypage-translation-result">
                        {result || "번역문 없음"}
                      </p>
                    </div>
                  </div>

                  <div
                    className="mypage-translation-actions"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <button
                      type="button"
                      className={`mypage-icon-btn ${item.favorite ? "on" : ""}`}
                      onClick={() => onToggleFavorite?.(item.id)}
                      aria-label={item.favorite ? "즐겨찾기 해제" : "즐겨찾기"}
                    >
                      {item.favorite ? <FaStar /> : <FaRegStar />}
                    </button>

                    <button
                      type="button"
                      className="mypage-icon-btn danger"
                      onClick={() => onDelete?.(item.id)}
                      aria-label="삭제"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {selectedItem && (
        <TranslationDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onToggleFavorite={onToggleFavorite}
          onDelete={onDelete}
        />
      )}
    </>
  );
}

function TranslationDetailModal({ item, onClose, onToggleFavorite, onDelete }) {
  const source = item.sourceText ?? item.source ?? item.text ?? "";

  const result = item.translatedText ?? item.result ?? item.translation ?? "";

  const sourceLanguage = item.sourceLanguage ?? item.fromLanguage ?? "원문";

  const targetLanguage = item.targetLanguage ?? item.toLanguage ?? "번역";

  const createdAt = item.createdAt
    ? new Date(item.createdAt).toLocaleString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "날짜 정보 없음";

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const handleDelete = () => {
    onDelete?.(item.id);
    onClose();
  };

  const handleCopy = async (text) => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error("복사 실패:", error);
    }
  };

  return (
    <div className="translation-detail-backdrop" onClick={onClose}>
      <div
        className="translation-detail-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="translation-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="translation-detail-header">
          <div className="translation-detail-heading">
            <span className="translation-detail-eyebrow">
              TRANSLATION DETAIL
            </span>

            <h2 id="translation-detail-title">번역 기록</h2>

            <p>번역 내용을 자세하게 확인할 수 있어요.</p>
          </div>

          <button
            type="button"
            className="translation-detail-close"
            onClick={onClose}
            aria-label="닫기"
          >
            <FaTimes />
          </button>
        </header>

        <div className="translation-detail-info">
          <div className="translation-detail-language">
            <span className="translation-language-chip source">
              {sourceLanguage}
            </span>

            <span className="translation-detail-language-arrow">→</span>

            <span className="translation-language-chip target">
              {targetLanguage}
            </span>
          </div>

          <time className="translation-detail-time">{createdAt}</time>
        </div>

        <div className="translation-detail-body">
          <section className="translation-detail-box source">
            <div className="translation-detail-box-head">
              <div>
                <span className="translation-detail-label">원문</span>

                <span className="translation-detail-box-language">
                  {sourceLanguage}
                </span>
              </div>

              <button
                type="button"
                className="translation-detail-copy"
                onClick={() => handleCopy(source)}
                disabled={!source}
                aria-label="원문 복사"
              >
                <FaCopy />
                <span>복사</span>
              </button>
            </div>

            <p>{source || "원문이 없습니다."}</p>
          </section>

          <div className="translation-detail-divider" aria-hidden="true">
            <span>TRANSLATION</span>
          </div>

          <section className="translation-detail-box result">
            <div className="translation-detail-box-head">
              <div>
                <span className="translation-detail-label">번역문</span>

                <span className="translation-detail-box-language">
                  {targetLanguage}
                </span>
              </div>

              <button
                type="button"
                className="translation-detail-copy"
                onClick={() => handleCopy(result)}
                disabled={!result}
                aria-label="번역문 복사"
              >
                <FaCopy />
                <span>복사</span>
              </button>
            </div>

            <p>{result || "번역문이 없습니다."}</p>
          </section>
        </div>

        <footer className="translation-detail-actions">
          <button
            type="button"
            className={`translation-detail-favorite ${
              item.favorite ? "active" : ""
            }`}
            onClick={() => onToggleFavorite?.(item.id)}
          >
            {item.favorite ? (
              <>
                <FaStar />
                즐겨찾기 해제
              </>
            ) : (
              <>
                <FaRegStar />
                즐겨찾기
              </>
            )}
          </button>

          <button
            type="button"
            className="translation-detail-delete"
            onClick={handleDelete}
          >
            <FaTrash />
            삭제
          </button>
        </footer>
      </div>
    </div>
  );
}

export default RecentTranslations;
