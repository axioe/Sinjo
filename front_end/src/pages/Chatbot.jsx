import { useEffect, useState, useRef } from "react";
import "../css/Chatbot.css";
import { request } from "../api/client";

function Chatbot() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await request("/api/words/categories");
      setCategories(data);
    } catch (error) {
      console.error("카테고리 조회 실패:", error);
    }
  };

  const ask = async () => {
    const text = question.trim();
    if (!text || loading) {
      return;
    }
    setMessages((prev) => [
      ...prev,
      {
        type: "user",
        text: text,
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
      const result = await request(`/api/words/search?${params.toString()}`);
      if (result != null) {
        if (result.found) {
          const data = result.wordAnswers[0];
          setMessages((prev) => [
            ...prev,
            {
              type: "bot",
              data: data,
            },
          ]);
        }
      }
    } catch (error) {
      console.error(error);

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

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      ask();
    }
  };

  const chatAreaRef = useRef(null);

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages, loading]);

  return (
    <div className="slang-chatbot">
      {/* Category */}
      <div className="category-container">
        <button
          className={selectedCategory === null ? "category active" : "category"}
          onClick={() => setSelectedCategory(null)}
        >
          전체
        </button>

        {categories.map((category) => (
          <button
            key={category}
            className={
              selectedCategory === category ? "category active" : "category"
            }
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Chat */}
      <main className="chat-area" ref={chatAreaRef}>
        {messages.length === 0 ? (
          <Welcome />
        ) : (
          messages.map((message, index) => (
            <Message key={index} message={message} />
          ))
        )}

        {loading && (
          <div className="bot-row">
            <div className="bot-avatar">🤖</div>

            <div className="typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </main>

      {/* Input */}
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
            onClick={ask}
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

function Welcome() {
  return (
    <div className="welcome">
      <div className="welcome-icon">💬</div>

      <h2>신조어가 궁금하신가요?</h2>

      <p>궁금한 표현이나 신조어의 뜻을 물어보세요.</p>

      <div className="suggestions">
        <button>"럭키비키 뜻이 뭐야?"</button>

        <button>"혼자 밥 먹는 걸 뭐라고 해?"</button>

        <button>"요즘 많이 쓰는 신조어 알려줘"</button>
      </div>
    </div>
  );
}

function Message({ message }) {
  if (message.type === "user") {
    return (
      <div className="user-row">
        <div className="user-message">{message.text}</div>
      </div>
    );
  }

  const data = message.data;

  if (!data.found) {
    return (
      <div className="bot-row">
        <div className="bot-avatar">🤖</div>

        <div className="bot-message">
          <div className="answer">{data.answer}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bot-row">
      <div className="bot-avatar">🤖</div>

      <div className="bot-message">
        <div className="answer">{data.answer}</div>

        <div className="word-card">
          <div className="word-title">{data.word}</div>

          <div className="word-item">
            <span>카테고리</span>

            <strong>{data.category}</strong>
          </div>

          <div className="word-item">
            <span>의미</span>

            <strong>{data.meaning}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chatbot;
