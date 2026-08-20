import "../css/Ranking.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRankingWords } from "../api/wordApi";

function Ranking() {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;

    const fetchRankingWords = async () => {
      try {
        /**
         * [수정] 서버가 이미 좋아요 순으로 정렬한 TOP 5 를 rank 까지 붙여 내려준다.
         * 기존 코드는 그 결과를 다시 sort + slice(0, 5) 하고 있었다.
         * 서버가 준 rank 도 쓰지 않고 화면에서 index + 1 로 다시 매겼다.
         * 서버와 화면 두 곳에서 순위를 매기면 나중에 규칙이 바뀔 때 반드시 어긋난다.
         */
        const data = await getRankingWords();
        if (alive) setWords(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        if (alive) setError("인기 신조어 데이터를 불러오는 데 실패했습니다.");
      } finally {
        if (alive) setLoading(false);
      }
    };

    fetchRankingWords();

    return () => {
      alive = false;
    };
  }, []);

  // 신조어 클릭 → 사전으로 이동
  const goToDictionary = (word) => {
    navigate(`/dictionary?word=${encodeURIComponent(word)}`);
  };

  if (loading) {
    return (
      <div className="ranking-page">
        <h1>🏆 신조어 인기 랭킹 TOP 5</h1>
        <p>인기 신조어를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ranking-page">
        <h1>🏆 신조어 인기 랭킹 TOP 5</h1>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="ranking-page">
      <h1>🏆 신조어 인기 랭킹 TOP 5</h1>

      <div className="rank-container">
        {words.length > 0 ? (
          words.map((item, index) => (
            /**
             * [수정] div 에 onClick 만 걸면 키보드로는 누를 수 없다.
             * button 으로 바꿔 Tab / Enter 로도 이동할 수 있게 했다.
             */
            <button
              type="button"
              className="rank-card"
              key={item.id}
              onClick={() => goToDictionary(item.word)}
            >
              <div className="rank">{item.rank ?? index + 1}</div>

              <div className="word-info">
                <h2>{item.word}</h2>
                <p>{item.meaning}</p>
              </div>

              <div className="ranking-likes">❤️ {item.likes}</div>
            </button>
          ))
        ) : (
          <div className="no-ranking">아직 등록된 신조어가 없습니다.</div>
        )}
      </div>
    </div>
  );
}

export default Ranking;
