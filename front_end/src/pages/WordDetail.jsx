import "../css/WordDetail.css";

import { useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import { getWord, likeWord as likeWordApi } from "../api/wordApi";

function WordDetail() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [word, setWord] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [liking, setLiking] = useState(false);

  const [favorite, setFavorite] = useState(false);

  /**
   * 즐겨찾기 확인
   */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("dictionaryFavorites");

      const ids = saved ? JSON.parse(saved) : [];

      setFavorite(ids.includes(Number(id)));
    } catch (err) {
      console.error(err);
    }
  }, [id]);

  /**
   * 상세 조회
   *
   * 백엔드에서 조회수 +1
   */
  useEffect(() => {
    let alive = true;

    const fetchWord = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getWord(id);

        if (alive) {
          setWord(data);
        }
      } catch (err) {
        console.error(err);

        if (alive) {
          setError("신조어 정보를 불러오지 못했습니다.");
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };

    fetchWord();

    return () => {
      alive = false;
    };
  }, [id]);

  /**
   * 좋아요
   */
  const likeWord = async () => {
    if (liking || !word) {
      return;
    }

    setLiking(true);

    try {
      const updated = await likeWordApi(word.id);

      setWord(updated);
    } catch (err) {
      console.error(err);

      setError("좋아요 처리에 실패했습니다.");
    } finally {
      setLiking(false);
    }
  };

  /**
   * 즐겨찾기
   */
  const toggleFavorite = () => {
    try {
      const saved = localStorage.getItem("dictionaryFavorites");

      const ids = saved ? JSON.parse(saved) : [];

      const numericId = Number(id);

      let nextIds;

      if (ids.includes(numericId)) {
        nextIds = ids.filter((itemId) => itemId !== numericId);

        setFavorite(false);
      } else {
        nextIds = [...ids, numericId];

        setFavorite(true);
      }

      localStorage.setItem("dictionaryFavorites", JSON.stringify(nextIds));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="word-detail-page">
        <p className="detail-loading">신조어 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (error || !word) {
    return (
      <div className="word-detail-page">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/dictionary")}
        >
          ← 사전으로 돌아가기
        </button>

        <div className="detail-error">
          {error || "신조어를 찾을 수 없습니다."}
        </div>
      </div>
    );
  }

  return (
    <div className="word-detail-page">
      <button
        type="button"
        className="back-button"
        onClick={() => navigate("/dictionary")}
      >
        ← 사전으로 돌아가기
      </button>

      <article className="word-detail-card">
        <div className="detail-meta">
          <span className="detail-category">
            {word.category?.trim() || "기타"}
          </span>

          {word.era?.trim() && <span className="detail-era">{word.era}</span>}
        </div>

        <h1 className="detail-word">{word.word}</h1>

        <div className="detail-stats">
          <span>👀 조회 {word.views ?? 0}</span>

          <span>❤️ 좋아요 {word.likes ?? 0}</span>
        </div>

        <section className="detail-section">
          <h2>뜻</h2>

          <p>{word.meaning}</p>
        </section>

        <section className="detail-section example-section">
          <h2>예문</h2>

          <p>"{word.example}"</p>
        </section>

        <div className="detail-actions">
          <button
            type="button"
            className={
              favorite
                ? "detail-favorite-button active"
                : "detail-favorite-button"
            }
            onClick={toggleFavorite}
          >
            {favorite ? "⭐ 즐겨찾기 해제" : "☆ 즐겨찾기"}
          </button>

          <button
            type="button"
            className="detail-like-button"
            onClick={likeWord}
            disabled={liking}
          >
            ❤️ {liking ? "처리 중..." : "좋아요"}
          </button>
        </div>
      </article>
    </div>
  );
}

export default WordDetail;
