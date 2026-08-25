import { useEffect, useRef, useState } from "react";
import "../css/Chatbot.css";
import { request } from "../api/client";
import AiLearning from "./AiLearning";
import slang from "../assets/images/chatbot.png";

function Chatbot() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [loading, setLoading] = useState(false);

  /*
   * CHAT
   * LEARNING
   */
  const [mode, setMode] = useState("CHAT");

  /*
   * 카테고리 스크롤
   */
  const categoryRef = useRef(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const chatAreaRef = useRef(null);

  /*
   * ==============================
   * 카테고리 조회
   * ==============================
   */

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await request("/api/words/categories");

      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("카테고리 조회 실패:", error);
    }
  };

  /*
   * ==============================
   * 카테고리 스크롤 상태 확인
   * ==============================
   */

  const updateCategoryScroll = () => {
    const container = categoryRef.current;

    if (!container) {
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = container;

    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
  };

  /*
   * 카테고리 데이터가 변경되었을 때
   */
  useEffect(() => {
    updateCategoryScroll();

    const container = categoryRef.current;

    if (!container) {
      return;
    }

    const handleResize = () => {
      updateCategoryScroll();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [categories, mode]);

  /*
   * ==============================
   * 카테고리 좌우 이동
   * ==============================
   */

  const scrollCategories = (direction) => {
    const container = categoryRef.current;

    if (!container) {
      return;
    }

    const scrollAmount = 180;

    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });

    /*
     * smooth scroll 이후 상태가 바뀌므로
     * 약간의 시간 후 다시 확인
     */
    setTimeout(updateCategoryScroll, 250);
  };

  /*
   * 실제 손가락/마우스로 스크롤했을 때
   */
  const handleCategoryScroll = () => {
    updateCategoryScroll();
  };

  /*
   * ==============================
   * 자동 스크롤
   * ==============================
   */

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop =
        chatAreaRef.current.scrollHeight;
    }
  }, [messages, loading]);

  /*
   * ==============================
   * 질문
   * ==============================
   */

  const ask = async (inputText = null) => {
    const text = (inputText ?? question).trim();

    if (!text || loading) {
      return;
    }

    /*
     * 사용자 메시지
     */
    setMessages((prev) => [
      ...prev,
      {
        type: "user",
        text,
      },
    ]);

    setQuestion("");
    setLoading(true);

    try {
      const params = new URLSearchParams();

      params.append("question", text);

      if (selectedCategory) {
        params.append("category", selectedCategory);
      }

      /*
       * 서버
       *
       * PVector 검색
       * ↓
       * DB 확인
       * ↓
       * LLM 답변
       */

      const result = await request(
        `/api/words/ask?${params.toString()}`
      );

      /*
       * ============================
       * DB 기반 답변
       * ============================
       */

      if (result && result.found) {
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            data: result,
          },
        ]);

        return;
      }

      /*
       * ============================
       * LLM 답변
       * ============================
       */

      if (result && result.answer) {
        setMessages((prev) => [
          ...prev,
          {
            type: "ai",
            text: result.answer,
          },
        ]);

        return;
      }

      /*
       * ============================
       * 아무 결과도 없는 경우
       * ============================
       */

      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          data: {
            found: false,
            answer: "관련 정보를 찾지 못했어요.",
          },
        },
      ]);
    } catch (error) {
      console.error("신조어 질문 실패:", error);

      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          data: {
            found: false,
            answer: "서버와 연결할 수 없습니다.",
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  /*
   * ==============================
   * Enter
   * ==============================
   */

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      ask();
    }
  };

  /*
   * ==============================
   * 모드 변경
   * ==============================
   */

  const changeMode = (nextMode) => {
    setMode(nextMode);

    if (nextMode === "LEARNING") {
      setSelectedCategory(null);
    }
  };

  /*
   * ==============================
   * 대화 삭제
   * ==============================
   */

  const clearMessages = () => {
    setMessages([]);
  };

  /*
   * ==============================
   * 학습
   * ==============================
   */

  if (mode === "LEARNING") {
    return (
      <div className="slang-chatbot">
        <AiLearning onBack={() => setMode("CHAT")} />
      </div>
    );
  }

  /*
   * ==============================
   * 메인
   * ==============================
   */

  return (
    <div className="slang-chatbot">

      {/* =========================
          Category
      ========================= */}

      <div className="category-wrapper">

        {/* 왼쪽 이동 버튼 */}

        {canScrollLeft && (
          <button
            type="button"
            className="category-scroll-button category-scroll-left"
            onClick={() => scrollCategories("left")}
            aria-label="이전 카테고리"
            title="이전 카테고리"
          >
            ‹
          </button>
        )}

        {/* 카테고리 */}

        <div
          className="category-container"
          ref={categoryRef}
          onScroll={handleCategoryScroll}
        >
          {/* 전체 */}

          <button
            type="button"
            className={
              mode === "CHAT" && selectedCategory === null
                ? "category active"
                : "category"
            }
            onClick={() => {
              setMode("CHAT");
              setSelectedCategory(null);
            }}
          >
            전체
          </button>

          {/* 학습 */}

          <button
            type="button"
            className={
              mode === "LEARNING"
                ? "category learning-category active"
                : "category learning-category"
            }
            onClick={() => changeMode("LEARNING")}
          >
            🎓 학습
          </button>

          {/* DB 카테고리 */}

          {categories.map((category) => (
            <button
              type="button"
              key={category}
              className={
                mode === "CHAT" &&
                selectedCategory === category
                  ? "category active"
                  : "category"
              }
              onClick={() => {
                setMode("CHAT");
                setSelectedCategory(category);
              }}
            >
              {category}
            </button>
          ))}
        </div>

        {/* 오른쪽 이동 버튼 */}

        {canScrollRight && (
          <button
            type="button"
            className="category-scroll-button category-scroll-right"
            onClick={() => scrollCategories("right")}
            aria-label="다음 카테고리"
            title="다음 카테고리"
          >
            ›
          </button>
        )}
      </div>

      {/* =========================
          Chat Area
      ========================= */}

      <main
        className="chat-area"
        ref={chatAreaRef}
      >
        {messages.length === 0 ? (
          <Welcome
            onLearning={() => setMode("LEARNING")}
            onAsk={ask}
          />
        ) : (
          messages.map((message, index) => (
            <Message
              key={index}
              message={message}
            />
          ))
        )}

        {/* Loading */}

        {loading && (
          <div className="bot-row">
            <div className="bot-avatar">
              <img
                src={slang}
                alt="신조어 AI"
              />
            </div>

            <div className="typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </main>

      {/* =========================
          Input
      ========================= */}

      <div className="input-area">

        {selectedCategory && (
          <div className="selected-category">
            <span>{selectedCategory}</span>

            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              aria-label="카테고리 선택 해제"
            >
              ×
            </button>
          </div>
        )}

        <div className="input-row">

          <textarea
            value={question}
            onChange={(event) =>
              setQuestion(event.target.value)
            }
            onKeyDown={handleKeyDown}
            placeholder={
              selectedCategory
                ? `${selectedCategory} 관련 신조어를 물어보세요`
                : "궁금한 신조어를 물어보세요"
            }
            disabled={loading}
            rows={1}
          />

          {/* 전송 */}

          <button
            type="button"
            className="send-button"
            onClick={() => ask()}
            disabled={
              loading ||
              !question.trim()
            }
            aria-label="질문 보내기"
            title="질문 보내기"
          >
            <span>↑</span>
          </button>

        </div>

        <div className="input-help">
          Enter로 질문하기 · Shift + Enter 줄바꿈
        </div>
      </div>
    </div>
  );
}

/*
 * ==============================
 * Welcome
 * ==============================
 */

function Welcome({
  onLearning,
  onAsk,
}) {
  const suggestions = [
    "럭키비키 뜻이 뭐야?",
    "요즘 많이 쓰는 신조어 알려줘",
    "이 신조어는 어떻게 사용해?",
  ];

  return (
    <div className="welcome">

      <div className="welcome-icon">
        <img
          src={slang}
          alt="신조어 AI"
        />
      </div>

      <h2>신조어가 궁금하신가요?</h2>

      <p>
        궁금한 신조어를 물어보세요.
      </p>

      <div className="suggestions">
        {suggestions.map((text) => (
          <button
            type="button"
            key={text}
            onClick={() => onAsk(text)}
          >
            "{text}"
          </button>
        ))}
      </div>

      <button
        type="button"
        className="learning-entry-button"
        onClick={onLearning}
      >
        <span>🎓</span>
        오늘의 신조어 5개 학습하기
      </button>
    </div>
  );
}

/*
 * ==============================
 * Message
 * ==============================
 */

function Message({ message }) {

  /*
   * 사용자
   */

  if (message.type === "user") {
    return (
      <div className="user-row">
        <div className="user-message">
          {message.text}
        </div>
      </div>
    );
  }

  /*
   * LLM
   */

  if (message.type === "ai") {
    return (
      <div className="bot-row">

        <div className="bot-avatar">
          <img
            src={slang}
            alt="신조어 AI"
          />
        </div>

        <div className="bot-message ai-message">

          <div className="ai-label">
            ✨ AI 답변
          </div>

          <div className="answer">
            {message.text}
          </div>

        </div>
      </div>
    );
  }

  /*
   * DB
   */

  const data = message.data;

  if (!data || !data.found) {
    return (
      <div className="bot-row">

        <div className="bot-avatar">
          <img
            src={slang}
            alt="신조어 AI"
          />
        </div>

        <div className="bot-message">

          <div className="answer">
            {data?.answer ||
              "관련 정보를 찾지 못했어요."}
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="bot-row">

      <div className="bot-avatar">
        <img
          src={slang}
          alt="신조어 AI"
        />
      </div>

      <div className="bot-message">

        <div className="answer">
          {data.answer}
        </div>

        {data.word && (
          <div className="word-card">

            <div className="word-title">
              {data.word}
            </div>

            {data.category && (
              <div className="word-item">
                <span>카테고리</span>

                <strong>
                  {data.category}
                </strong>
              </div>
            )}

            {data.meaning && (
              <div className="word-item">
                <span>의미</span>

                <strong>
                  {data.meaning}
                </strong>
              </div>
            )}

            {data.example && (
              <div className="word-item">
                <span>예문</span>

                <strong>
                  {data.example}
                </strong>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}

export default Chatbot;
