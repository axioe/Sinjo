import "../../css/mypage/RecentTranslations.css";
import { FaStar, FaTrashAlt } from "react-icons/fa";

/**
 * 즐겨찾기 단어
 */
function FavoriteWords({ items = [], onRemove }) {
  return (
    <section className="mypage-card">
      <div className="mypage-card-head">
        <h2 className="mypage-card-title">
          <FaStar className="mypage-card-title-icon" />
          즐겨찾기 단어
        </h2>
      </div>

      {items.length === 0 ? (
        <p className="mypage-empty">즐겨찾기한 단어가 없습니다.</p>
      ) : (
        <ul className="mypage-translation-list">
          {items.map((item) => (
            <li key={item.id} className="mypage-translation">
              <p className="mypage-translation-source">{item.word}</p>

              <span className="mypage-translation-arrow" aria-hidden="true">
                →
              </span>

              <p className="mypage-translation-result">{item.meaning}</p>

              <span className="mypage-translation-date">{item.createdAt}</span>

              <button
                type="button"
                className="mypage-icon-btn danger"
                onClick={() => onRemove?.(item.wordId)}
                aria-label={`${item.word} 즐겨찾기 해제`}
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

export default FavoriteWords;
