import "../../css/dictionary/Ranking.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp } from "lucide-react";

import { getRankingWords } from "../../api/wordApi";
import { getGoogleTrendRanking } from "../../api/trendApi";

function Ranking() {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [trends, setTrends] = useState([]);
  const [trendLoading, setTrendLoading] = useState(true);
  const [trendError, setTrendError] = useState("");

  const [expandedTrend, setExpandedTrend] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;

    /**
     * 신조어 인기 랭킹 TOP 5 조회
     * Spring Boot :8080
     */
    const fetchRankingWords = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getRankingWords();

        if (alive) {
          setWords(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("신조어 인기 랭킹 조회 실패:", err);

        if (alive) {
          setError("인기 신조어 데이터를 불러오는 데 실패했습니다.");
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };

    /**
     * Google Trends TOP 5 조회
     * FastAPI :8000
     */
    const fetchGoogleTrends = async () => {
      try {
        setTrendLoading(true);
        setTrendError("");

        const data = await getGoogleTrendRanking();

        console.log("Google Trends:", data);

        const source = Array.isArray(data) ? data : [];

        /**
         * 같은 keyword가 여러 번 내려오는 경우
         * 첫 번째 데이터만 사용한다.
         */
        const uniqueMap = new Map();

        source.forEach((item) => {
          const keyword = item?.keyword?.trim();

          if (!keyword) {
            return;
          }

          if (!uniqueMap.has(keyword)) {
            uniqueMap.set(keyword, item);
          }
        });

        /**
         * 중복 제거 후 점수 내림차순 정렬
         * 상위 5개만 표시
         */
        const uniqueTrends = Array.from(uniqueMap.values())
          .sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0))
          .slice(0, 5);

        if (alive) {
          setTrends(uniqueTrends);
        }
      } catch (err) {
        console.error("Google Trends 조회 실패:", err);

        if (alive) {
          setTrendError("Google Trends 데이터를 불러오지 못했습니다.");
        }
      } finally {
        if (alive) {
          setTrendLoading(false);
        }
      }
    };

    fetchRankingWords();
    fetchGoogleTrends();

    return () => {
      alive = false;
    };
  }, []);

  /**

* 신조어 클릭 → 상세 페이지 이동
  */
  const goToDictionary = (id) => {
    navigate(`/dictionary/${id}`);
  };

  return (
    <div className="ranking-page">
      {/* =========================================
      신조어 인기 랭킹 TOP 5
      ========================================= */}
      <section className="ranking-section">
        <div className="ranking-section-header">
          <div className="ranking-section-title">
            <div className="ranking-section-icon">🏆</div>

            <div>
              <h1>신조어 인기 랭킹 TOP 5</h1>
              <p>사용자들이 가장 많이 좋아한 신조어입니다.</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="ranking-message">
            인기 신조어를 불러오는 중입니다...
          </div>
        ) : error ? (
          <div className="ranking-message error">{error}</div>
        ) : words.length > 0 ? (
          <div className="rank-container">
            {words.map((item, index) => (
              <button
                type="button"
                className="rank-card"
                key={item.id}
                onClick={() => goToDictionary(item.id)}
              >
                <div className={`rank rank-${index + 1}`}>
                  {item.rank ?? index + 1}
                </div>

                <div className="word-info">
                  <h2>{item.word}</h2>

                  <p>{item.meaning}</p>
                </div>

                <div className="ranking-likes">
                  <span>❤️</span>
                  <strong>{item.likes ?? 0}</strong>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="ranking-message">아직 등록된 신조어가 없습니다.</div>
        )}
      </section>
      {/* =========================================
      Google Trends TOP 5
      ========================================= */}
      <section className="google-trend-ranking">
        <div className="google-trend-header">
          <div className="google-trend-title">
            <div className="google-trend-icon">
              <TrendingUp size={22} />
            </div>

            <div>
              <span className="google-trend-label">GOOGLE TRENDS</span>

              <h2>실시간 인기 신조어 TOP 5</h2>

              <p>현재 검색량이 높은 키워드입니다.</p>
            </div>
          </div>

          <span className="google-trend-region">대한민국</span>
        </div>

        {trendLoading ? (
          <div className="trend-message">
            Google Trends 데이터를 불러오는 중입니다...
          </div>
        ) : trendError ? (
          <div className="trend-message error">{trendError}</div>
        ) : trends.length > 0 ? (
          <div className="trend-list">
            {trends.map((item, index) => {
              const isExpanded = expandedTrend === index;

              return (
                <div
                  key={`${item.keyword}-${index}`}
                  className={`trend-card-wrapper ${
                    isExpanded ? "expanded" : ""
                  }`}
                >
                  <button
                    type="button"
                    className="trend-card"
                    onClick={() => setExpandedTrend(isExpanded ? null : index)}
                  >
                    <div className={`trend-rank trend-rank-${index + 1}`}>
                      {index + 1}
                    </div>

                    <div className="trend-info">
                      <h3>{item.keyword}</h3>

                      <p
                        className={`trend-summary ${
                          isExpanded ? "expanded" : ""
                        }`}
                      >
                        {item.meaning || "등록된 내용이 없습니다."}
                      </p>

                      {isExpanded && (
                        <div className="trend-example">
                          <span>사용 예시</span>
                          <p>
                            {item.example || "등록된 사용 예시가 없습니다."}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="trend-score">
                      <span>검색지수</span>
                      <strong>{item.score ?? 0}</strong>
                    </div>

                    <div className="trend-expand-icon">
                      {isExpanded ? "⌃" : "⌄"}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="trend-message">
            현재 구글 트렌드 인기 신조어가 없습니다.
          </div>
        )}

        <div className="google-trend-footer">
          <span>Data source: Google Trends</span>
        </div>
      </section>
    </div>
  );
}

export default Ranking;
