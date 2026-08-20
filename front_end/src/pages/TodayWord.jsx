import "../css/TodayWord.css";
import { useEffect, useMemo, useState } from "react";
import { FaSyncAlt } from "react-icons/fa";
import { getWords } from "../api/wordApi";

/**
 * 오늘 날짜를 숫자 하나로 만든다.
 *
 * 예:
 * 2026-08-19 → 20260819
 *
 * 같은 날짜에는 같은 seed가 만들어지기 때문에
 * 같은 날에는 항상 같은 랜덤 순서를 만들 수 있다.
 */
function todaySeed() {
  const now = new Date();

  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

/**
 * seed를 이용해서 배열을 랜덤하게 섞는다.
 *
 * 같은 배열 + 같은 seed
 * → 항상 같은 순서
 */
function shuffleWithSeed(list, seed) {
  const copy = [...list];
  let state = seed;

  for (let i = copy.length - 1; i > 0; i -= 1) {
    state = (state * 1103515245 + 12345) % 2147483648;

    const j = state % (i + 1);

    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function TodayWord() {
  const [allWords, setAllWords] = useState([]);
  const [cursor, setCursor] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    const fetchWords = async () => {
      try {
        const data = await getWords();

        if (alive) {
          setAllWords(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error(err);

        if (alive) {
          setError("오늘의 신조어를 불러오는 데 실패했습니다.");
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    };

    fetchWords();

    return () => {
      alive = false;
    };
  }, []);

  /**
   * 오늘의 신조어 5개
   *
   * 1. 전체 신조어 중 조회수가 높은 순서로 정렬
   * 2. 조회수 상위 5개만 선택
   * 3. 오늘 날짜를 seed로 사용해서 랜덤 순서로 섞음
   *
   * 결과:
   *
   * 오늘:
   * A, B, C, D, E
   * ↓
   * C, A, E, B, D
   *
   * 새로고침:
   * C, A, E, B, D
   *
   * 다음 날:
   * 조회수 상위 5개를 다시 선정하고
   * 새로운 날짜 seed로 다시 섞음
   */
  const todayWords = useMemo(() => {
    if (allWords.length === 0) {
      return [];
    }

    /**
     * 조회수 높은 순으로 정렬한다.
     *
     * 원본 allWords를 변경하지 않도록
     * [...allWords]로 복사한 뒤 정렬한다.
     */
    const topFive = [...allWords]
      .sort((a, b) => {
        const viewsA = Number(a.views ?? 0);
        const viewsB = Number(b.views ?? 0);

        return viewsB - viewsA;
      })
      .slice(0, 5);

    /**
     * 오늘 날짜를 seed로 사용한다.
     *
     * 따라서 같은 날에는 항상 같은 순서가 나온다.
     */
    return shuffleWithSeed(topFive, todaySeed());
  }, [allWords]);

  /**
   * 현재 보여줄 신조어
   */
  const today = todayWords[cursor] ?? null;

  /**
   * 조회수 상위 5개 중 다음 신조어 보기
   *
   * 이미 선정된 5개 안에서만 이동한다.
   */
  const changeWord = () => {
    if (todayWords.length <= 1) {
      return;
    }

    setCursor((prev) => (prev + 1) % todayWords.length);
  };

  if (loading) {
    return (
      <div className="today-page">
        <h1>📖 오늘의 신조어</h1>

        <p className="subtitle">오늘의 신조어를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="today-page">
        <h1>📖 오늘의 신조어</h1>

        <p className="subtitle">{error}</p>
      </div>
    );
  }

  if (!today) {
    return (
      <div className="today-page">
        <h1>📖 오늘의 신조어</h1>

        <p className="subtitle">등록된 신조어가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="today-page">
      <h1>📖 오늘의 신조어</h1>

      <p className="subtitle">오늘 조회수가 높은 신조어를 확인해보세요.</p>

      <div className="today-card">
        {today.category && <span className="category">{today.category}</span>}

        <h2>{today.word}</h2>

        <div className="meaning">
          <h3>뜻</h3>
          <p>{today.meaning}</p>
        </div>

        <div className="example">
          <h3>예문</h3>
          <p>"{today.example}"</p>
        </div>

        <button
          type="button"
          className="refresh-btn"
          onClick={changeWord}
          disabled={todayWords.length <= 1}
        >
          <FaSyncAlt />
          다른 신조어 보기
        </button>
      </div>
    </div>
  );
}

export default TodayWord;
