import { useEffect, useRef, useState } from "react";
import "../../css/chatbot/Chatbot.css";
import { FaMicrophone, FaStop, FaUpload, FaArrowUp } from "react-icons/fa";
import { request } from "../../api/client";
import { transcribeAudio } from "../../api/sttApi";
import AiLearning from "./AiLearning";
import slang from "../../assets/images/chatbot.png";

/** Whisper API가 허용하는 최대 업로드 용량 */
const MAX_AUDIO_FILE_SIZE = 25 * 1024 * 1024;

function Chatbot() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [loading, setLoading] = useState(false);

  /*
   * 음성 인식
   */
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const fileInputRef = useRef(null);

  /*
   * CHAT / LEARNING
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
   * 카테고리 스크롤 상태
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
   * 카테고리 이동
   * ==============================
   */

  const scrollCategories = (direction) => {
    const container = categoryRef.current;

    if (!container) {
      return;
    }

    container.scrollBy({
      left: direction === "left" ? -180 : 180,
      behavior: "smooth",
    });

    setTimeout(updateCategoryScroll, 250);
  };

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
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
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

      const result = await request(`/api/words/ask?${params.toString()}`);

      /*
       * DB 답변
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
       * AI 답변
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
       * 결과 없음
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
   * STT 오류
   * ==============================
   */

  const pushSttError = (text) => {
    setMessages((prev) => [
      ...prev,
      {
        type: "bot",
        data: {
          found: false,
          answer: text,
        },
      },
    ]);
  };

  /*
   * ==============================
   * 녹음 시작
   * ==============================
   */

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      pushSttError("이 브라우저에서는 음성 인식을 지원하지 않습니다.");

      return;
    }

    let stream;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
    } catch {
      pushSttError(
        "마이크 권한이 필요합니다. 브라우저 설정에서 허용해 주세요.",
      );

      return;
    }

    const mimeType = MediaRecorder.isTypeSupported("audio/webm")
      ? "audio/webm"
      : "";

    const recorder = mimeType
      ? new MediaRecorder(stream, {
          mimeType,
        })
      : new MediaRecorder(stream);

    chunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());

      const blob = new Blob(chunksRef.current, {
        type: recorder.mimeType || "audio/webm",
      });

      setIsTranscribing(true);

      try {
        const text = await transcribeAudio(blob);

        setQuestion((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text));
      } catch (err) {
        pushSttError(err.message);
      } finally {
        setIsTranscribing(false);
      }
    };

    recorder.start();

    mediaRecorderRef.current = recorder;

    setIsRecording(true);
  };

  /*
   * ==============================
   * 녹음 중지
   * ==============================
   */

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
  };

  /*
   * ==============================
   * 마이크
   * ==============================
   */

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  /*
   * ==============================
   * 파일 업로드
   * ==============================
   */

  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("audio/")) {
      pushSttError("오디오 파일만 업로드할 수 있습니다.");

      return;
    }

    if (file.size > MAX_AUDIO_FILE_SIZE) {
      pushSttError("파일 용량은 25MB를 넘을 수 없습니다.");

      return;
    }

    setIsTranscribing(true);

    try {
      const text = await transcribeAudio(file, file.name);

      setQuestion((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text));
    } catch (err) {
      pushSttError(err.message);
    } finally {
      setIsTranscribing(false);
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
   * Main
   * ==============================
   */

  return (
    <div className="slang-chatbot">
      {/* =========================
          Category
      ========================= */}

      <div className="category-wrapper">
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

      <main className="chat-area" ref={chatAreaRef}>
        {messages.length === 0 ? (
          <Welcome onLearning={() => setMode("LEARNING")} onAsk={ask} />
        ) : (
          messages.map((message, index) => (
            <Message key={index} message={message} />
          ))
        )}

        {loading && (
          <div className="bot-row">
            <div className="bot-avatar">
              <img src={slang} alt="신조어 AI" />
            </div>

            <div className="typing">
              <span className="thinking-text">
                생각 중<span className="thinking-dots">...</span>
              </span>
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

        <div className="input-box">
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedCategory
                ? `${selectedCategory} 관련 신조어를 물어보세요`
                : "궁금한 신조어를 물어보세요"
            }
            disabled={loading}
            rows={1}
          />

          <div className="input-bottom">
            <div className="input-left-actions">
              {/* 음성 입력 */}
              <button
                type="button"
                className={`input-action-button ${
                  isRecording ? "recording" : ""
                }`}
                onClick={handleMicClick}
                disabled={isTranscribing || loading}
                aria-label={isRecording ? "녹음 중지" : "음성으로 입력"}
                title={isRecording ? "녹음 중지" : "음성으로 입력"}
              >
                {isRecording ? <FaStop /> : <FaMicrophone />}
                <span>{isRecording ? "녹음 중지" : "음성 입력"}</span>
              </button>

              {/* 음성 파일 업로드 */}
              <button
                type="button"
                className="input-action-button"
                onClick={handleFileUploadClick}
                disabled={isRecording || isTranscribing || loading}
                aria-label="음성 파일 업로드"
                title="음성 파일 업로드"
              >
                <FaUpload />
                <span>파일 업로드</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileChange}
                hidden
              />
            </div>

            {/* 전송 */}
            <button
              type="button"
              className="send-button"
              onClick={() => ask()}
              disabled={loading || !question.trim()}
              aria-label="질문 보내기"
              title="질문 보내기"
            >
              <FaArrowUp />
            </button>
          </div>
        </div>

        {(isRecording || isTranscribing) && (
          <p className="mic-status" role="status">
            {isRecording ? "듣고 있어요... 다시 누르면 멈춰요." : "인식 중..."}
          </p>
        )}

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
          <button type="button" key={text} onClick={() => onAsk(text)}>
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
        <div className="user-message">{message.text}</div>
      </div>
    );
  }

  /*
   * AI
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
