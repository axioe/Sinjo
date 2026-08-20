import { FaBookmark, FaStar, FaRegStar, FaTrashAlt } from "react-icons/fa";

/**
 * 최근 번역 저장 (REQ-AUTH-02)
 * 즐겨찾기 토글과 삭제는 부모가 상태를 들고 있고 여기서는 호출만 한다.
 */
function RecentTranslations({ items, onToggleFavorite, onDelete }) {
  return (
    <section className="mypage-card">
      <div className="mypage-card-head">
        <h2 className="mypage-card-title">
          <FaBookmark className="mypage-card-title-icon" />
          최근 번역 저장
        </h2>
        <button type="button" className="mypage-more">
          전체 보기 <span aria-hidden="true">›</span>
        </button>
      </div>

      {items.length === 0 ? (
        <p className="mypage-empty">저장된 번역이 없습니다.</p>
      ) : (
        <ul className="mypage-translation-list">
          {items.map((item) => (
            <li key={item.id} className="mypage-translation">
              <p className="mypage-translation-source">{item.source}</p>
              <span className="mypage-translation-arrow" aria-hidden="true">→</span>
              <p className="mypage-translation-result">{item.result}</p>
              <span className="mypage-translation-date">{item.createdAt}</span>

              <button
                type="button"
                className={`mypage-icon-btn ${item.favorite ? "on" : ""}`}
                onClick={() => onToggleFavorite(item.id)}
                aria-label={item.favorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                aria-pressed={item.favorite}
              >
                {item.favorite ? <FaStar /> : <FaRegStar />}
              </button>

              <button
                type="button"
                className="mypage-icon-btn danger"
                onClick={() => onDelete(item.id)}
                aria-label="삭제"
              >
                <FaTrashAlt />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default RecentTranslations;
