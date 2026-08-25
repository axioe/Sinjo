import { FaStar, FaTrashAlt } from "react-icons/fa";

/**
 * 즐겨찾기 단어 (REQ-MY-01)
 * 해제는 부모가 서버 요청과 목록 갱신을 맡고 여기서는 호출만 한다.
 */
function FavoriteWords({ items, onRemove }) {
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
                onClick={() => onRemove(item.wordId)}
                aria-label="즐겨찾기 해제"
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