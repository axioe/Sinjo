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
   * 자동 스크롤
   * ==============================
   */

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages, loading]);

  /*
   * ==============================
   * 질문
   *
   * 서버에서
   *
   * PVector DB 검색
   *       ↓
   * DB 있으면 DB + LLM
   *       ↓
   * 없으면 LLM
   *
   * 전체 과정을 처리
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
       * 핵심 API
       *
       * 서버가
       *
       * PVector 검색
       * → DB 확인
       * → LLM 답변
       *
       * 을 처리
       */

      const result = await request(`/api/words/ask?${params.toString()}`);

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

      <div className="category-container">
        {/* 전체 */}

        <button
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
            key={category}
            className={
              mode === "CHAT" && selectedCategory === category
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

      {/* =========================
          Chat Area
      ========================= */}

      <main className="chat-area" ref={chatAreaRef}>
        {messages.length === 0 ? (
          <Welcome onLearning={() => setMode("LEARNING")} onAsk={ask} />
        ) : (
          messages.map((message, index) => (
            <Message key={index} message={message} />
          ))
        )}

        {/* Loading */}

        {loading && (
          <div className="bot-row">
            <div className="bot-avatar">
              <img src={slang} alt="신조어 AI" />
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
            {selectedCategory}

            <button onClick={() => setSelectedCategory(null)}>×</button>
          </div>
        )}

        <div className="input-row">
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedCategory
                ? `${selectedCategory} 관련 신조어를 물어보세요`
                : "신조어를 물어보세요"
            }
            disabled={loading}
          />

          <button
            className="send-button"
            onClick={() => ask()}
            disabled={loading || !question.trim()}
          >
            ↑
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

function Welcome({ onLearning, onAsk }) {
  const suggestions = [
    "럭키비키 뜻이 뭐야?",
    "요즘 많이 쓰는 신조어 알려줘",
    "이 신조어는 어떻게 사용해?",
  ];

  return (
    <div className="welcome">
      <div className="welcome-icon">
        <img src={slang} alt="신조어 AI" />
      </div>

      <h2>신조어가 궁금하신가요?</h2>

      <p>궁금한 신조어를 물어보세요.</p>

      <div className="suggestions">
        {suggestions.map((text) => (
          <button key={text} onClick={() => onAsk(text)}>
            "{text}"
          </button>
        ))}
      </div>

      <button className="learning-entry-button" onClick={onLearning}>
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
        <div className="user-message">{message.text}</div>
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
          <img src={slang} alt="신조어 AI" />
        </div>

        <div className="bot-message ai-message">
          <div className="ai-label">✨ AI 답변</div>

          <div className="answer">{message.text}</div>
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
          <img src={slang} alt="신조어 AI" />
        </div>

        <div className="bot-message">
          <div className="answer">
            {data?.answer || "관련 정보를 찾지 못했어요."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bot-row">
      <div className="bot-avatar">
        <img src={slang} alt="신조어 AI" />
      </div>

      <div className="bot-message">
        <div className="answer">{data.answer}</div>

        {data.word && (
          <div className="word-card">
            <div className="word-title">{data.word}</div>

            {data.category && (
              <div className="word-item">
                <span>카테고리</span>

                <strong>{data.category}</strong>
              </div>
            )}

            {data.meaning && (
              <div className="word-item">
                <span>의미</span>

                <strong>{data.meaning}</strong>
              </div>
            )}

            {data.example && (
              <div className="word-item">
                <span>예문</span>

                <strong>{data.example}</strong>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Chatbot;
