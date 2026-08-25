import { useState } from "react";
import Chatbot from "./Chatbot";
import "../css/ChatbotFloating.css";
import slang from "../assets/images/chatbot.png";

function ChatbotFloating() {
  const [open, setOpen] = useState(false);
  const [chatKey, setChatKey] = useState(0);

  const closeChatbot = () => {
    setOpen(false);
  };

  const newChat = () => {
    setChatKey((prev) => prev + 1);
  };

  return (
    <>
      {/* =========================
          Chatbot Window
      ========================= */}

      {open && (
        <div className="chatbot-window">
          {/* Header */}

          <div className="chatbot-window-header">
            <div className="chatbot-header-info">
              <strong>💬 신조어 AI</strong>

              <span>궁금한 신조어를 물어보세요</span>
            </div>

            <div className="chatbot-header-buttons">
              {/* 새 대화 */}

              <button
                type="button"
                className="chatbot-new-chat"
                onClick={newChat}
                title="새 대화"
              >
                ＋ 새 대화
              </button>

              {/* 종료 */}

              <button
                type="button"
                className="chatbot-close"
                onClick={closeChatbot}
                aria-label="챗봇 종료"
                title="챗봇 종료"
              >
                ×
              </button>
            </div>
          </div>

          {/* Chatbot */}

          <div className="chatbot-window-body">
            <Chatbot key={chatKey} />
          </div>
        </div>
      )}

      {/* =========================
          Floating Button
      ========================= */}

      {!open && (
        <button
          type="button"
          className="chatbot-floating-button"
          onClick={() => setOpen(true)}
          aria-label="신조어 챗봇 열기"
          title="신조어 챗봇"
        >
          <img src={slang} alt="신조어 챗봇" />

          <span className="chatbot-ai">AI</span>
        </button>
      )}
    </>
  );
}

export default ChatbotFloating;
