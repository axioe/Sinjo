import { Link } from "react-router-dom";
import {
  FaFire,
  FaBook,
  FaGamepad,
  FaBrain,
  FaArrowRight,
} from "react-icons/fa";
import { useEffect, useMemo, useState } from "react";

import slang from "../assets/images/slang.png";
import { getRankingWords, getWords } from "../api/wordApi";

import "../css/Main.css";

/* =========================================================
   오늘의 신조어와 동일한 날짜 기준
========================================================= */

function todaySeed() {
  const now = new Date();

  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

/* =========================================================
   TodayWord 페이지와 동일한 방식으로 섞기
========================================================= */

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

function Main() {
  /* =======================================================
     랭킹
  ======================================================= */

  const [ranking, setRanking] = useState([]);
  const [rankingLoading, setRankingLoading] = useState(true);
  const [rankingError, setRankingError] = useState("");

  /* =======================================================
     오늘의 신조어
  ======================================================= */

  const [allWords, setAllWords] = useState([]);
  const [todayLoading, setTodayLoading] = useState(true);
  const [todayError, setTodayError] = useState("");

  /* =======================================================
     랭킹 데이터
  ======================================================= */

  useEffect(() => {
    let alive = true;

    const fetchRanking = async () => {
      try {
        setRankingLoading(true);
        setRankingError("");

        const data = await getRankingWords();

        if (alive) {
          setRanking(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error(err);

        if (alive) {
          setRankingError("인기 신조어를 불러오지 못했습니다.");
        }
      } finally {
        if (alive) {
          setRankingLoading(false);
        }
      }
    };

    fetchRanking();

    return () => {
      alive = false;
    };
  }, []);

  /* =======================================================
     전체 신조어
  ======================================================= */

  useEffect(() => {
    let alive = true;

    const fetchWords = async () => {
      try {
        setTodayLoading(true);
        setTodayError("");

        const data = await getWords();

        if (alive) {
          setAllWords(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error(err);

        if (alive) {
          setTodayError("오늘의 신조어를 불러오지 못했습니다.");
        }
      } finally {
        if (alive) {
          setTodayLoading(false);
        }
      }
    };

    fetchWords();

    return () => {
      alive = false;
    };
  }, []);

  /* =======================================================
     오늘의 신조어

     getWords() → 날짜 기준으로 동일하게 섞음
     → 오늘의 첫 번째 단어를 메인에 표시
  ======================================================= */

  const todayWords = useMemo(() => {
    if (!Array.isArray(allWords) || allWords.length === 0) {
      return [];
    }

    return shuffleWithSeed(allWords, todaySeed()).slice(0, 5);
  }, [allWords]);

  const today = todayWords[0] ?? null;

  return (
    <main className="main">
      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="hero">
        <div className="hero-left">
          <span className="badge">🚀 AI 신조어 번역 서비스</span>

          <h1>
            신조어가 어렵다면
            <br />
            AI에게 맡겨보세요.
          </h1>

          <p>
            실시간 신조어 번역부터 퀴즈, 신조어 게임까지
            <br className="hero-description-break" />
            하나의 서비스에서 제공합니다.
          </p>

          <Link to="/translate" className="start">
            번역 시작하기
            <FaArrowRight />
          </Link>
        </div>

        <div className="hero-right">
          <img
            src={slang}
            alt="신조어를 표준어로 바꿔주는 서비스 소개 이미지"
            onError={(e) => {
              e.currentTarget.parentElement.style.display = "none";
            }}
          />
        </div>
      </section>

      {/* =====================================================
          FEATURE GRID
      ===================================================== */}

      <section className="feature-grid">
        {/* ===================================================
            랭킹
        =================================================== */}

        <div className="feature-card ranking-card">
          <div className="card-top">
            <div className="card-icon">
              <FaFire />
            </div>

            <span className="card-badge">RANK</span>
          </div>

          <div className="card-title-row">
            <h3>신조어 인기 랭킹</h3>
          </div>

          <div className="card-content ranking-content">
            {rankingLoading ? (
              <p className="data-message">인기 신조어를 불러오는 중...</p>
            ) : rankingError ? (
              <p className="data-message error">{rankingError}</p>
            ) : ranking.length > 0 ? (
              <ul className="ranking-list">
                {ranking.slice(0, 3).map((item, index) => (
                  <li key={item.id ?? item.word}>
                    <span className="ranking-number">
                      {String(item.rank ?? index + 1).padStart(2, "0")}
                    </span>

                    <span className="ranking-word">{item.word}</span>

                    <span className="ranking-likes-small">
                      ❤️ {item.likes ?? 0}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="data-message">등록된 신조어가 없습니다.</p>
            )}
          </div>

          <Link to="/ranking" className="card-button">
            랭킹 보러 가기
            <FaArrowRight />
          </Link>
        </div>

        {/* ===================================================
            오늘의 신조어
        =================================================== */}

        <div className="feature-card main-today-card">
          <div className="today-top">
            <div className="card-icon">
              <FaBook />
            </div>

            <span className="today-badge">TODAY</span>
          </div>

          <div className="card-title-row today-title">
            <h3>오늘의 신조어</h3>
          </div>

          <div className="today-content">
            {todayLoading ? (
              <p className="data-message">오늘의 신조어를 불러오는 중...</p>
            ) : todayError ? (
              <p className="data-message error">{todayError}</p>
            ) : today ? (
              <>
                <span className="today-label">오늘 배워볼 표현</span>

                {/* 실제 getWords()에서 받은 today.word */}
                <h2 className="today-word">{today.word}</h2>

                {/* 실제 getWords()에서 받은 today.meaning */}
                <p className="today-meaning">{today.meaning}</p>
              </>
            ) : (
              <p className="data-message">등록된 신조어가 없습니다.</p>
            )}
          </div>

          <Link to="/today" className="today-button">
            오늘의 신조어 보기
            <FaArrowRight />
          </Link>
        </div>

        {/* ===================================================
            게임
        =================================================== */}

        <div className="feature-card">
          <div className="card-top">
            <div className="card-icon">
              <FaGamepad />
            </div>

            <span className="card-badge">GAME</span>
          </div>

          <div className="card-title-row">
            <h3>신조어 게임</h3>
          </div>

          <div className="card-content">
            <p className="card-description">
              신조어로 재미있는 게임을 즐겨보세요.
            </p>
          </div>

          <Link to="/game" className="card-button">
            게임 시작
            <FaArrowRight />
          </Link>
        </div>

        {/* ===================================================
            테스트
        =================================================== */}

        <div className="feature-card">
          <div className="card-top">
            <div className="card-icon">
              <FaBrain />
            </div>

            <span className="card-badge">TEST</span>
          </div>

          <div className="card-title-row">
            <h3>신조어 이해도 테스트</h3>
          </div>

          <div className="card-content">
            <p className="card-description">
              당신의 신조어 실력을 확인해보세요.
            </p>
          </div>

          <Link to="/test" className="card-button">
            테스트 시작
            <FaArrowRight />
          </Link>
        </div>
      </section>

      {/* =====================================================
          HISTORY
      ===================================================== */}

      <section className="history">
        <div className="history-header">
          <h2>최근 번역</h2>

          <Link to="/translate" className="history-more">
            번역하러 가기
            <FaArrowRight />
          </Link>
        </div>

        <div className="history-box">
          <div className="history-item">
            <span className="history-label">신조어</span>
            <p>오늘 시험 억까였다</p>
          </div>

          <div className="history-item">
            <span className="history-label">번역 결과</span>
            <p>오늘 시험에서 부당한 불이익을 받았다.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Main;
