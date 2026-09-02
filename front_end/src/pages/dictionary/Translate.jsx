import "../../css/dictionary/Translate.css";
import { useRef, useState } from "react";
import { FaArrowRight, FaCopy, FaMicrophone, FaStop } from "react-icons/fa";
import { translate, saveTranslation } from "../../api/translateApi";
import { transcribeAudio } from "../../api/sttApi";

/**
 * [수정] 임시 사전을 컴포넌트 밖으로 빼고 Map 으로 바꿨다.
 *
 * 안에 두면 글자를 한 자 칠 때마다 객체를 새로 만든다. 그건 성능 문제이고,
 * 더 중요한 건 일반 객체에 dictionary[input] 으로 접근하는 방식이다.
 * 사용자가 "constructor", "toString", "__proto__" 같은 단어를 입력하면
 * 사전에 없는데도 프로토타입에 있는 함수가 그대로 반환된다.
 * 그 함수가 setResult 로 들어가면 React 가 렌더링 중 예외를 던져 화면이 죽는다.
 * Map 은 프로토타입 체인을 타지 않아 이 문제가 없다.
 */
const DICTIONARY = new Map([
  ["억까", "억지로 비판하거나 부당한 비난을 받는 상황"],
  ["갓생", "부지런하고 계획적인 삶"],
  ["킹받네", "매우 화가 난다는 의미"],
  ["알잘딱깔센", "알아서 잘 딱 깔끔하고 센스있게"],
]);

const NOT_FOUND = "등록되지 않은 신조어입니다.";
const MAX_HISTORY = 5;

function Translate() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [history, setHistory] = useState([]);
  const [notice, setNotice] = useState("");
  const [word, setWord] = useState("");
  const [example, setExample] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  /**
   * 음성 인식(STT, REQ-TR-STT).
   * 인식된 텍스트는 입력창에 채워 넣기만 하고 자동으로 번역하지 않는다 -
   * Whisper 가 신조어를 발음이 비슷한 표준어로 잘못 받아적을 수 있어서,
   * 사용자가 확인·수정한 뒤 직접 "번역하기"를 누르게 한다.
   */
  const startRecording = async () => {
    setNotice("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setNotice("이 브라우저에서는 음성 인식을 지원하지 않습니다.");
      return;
    }

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setNotice("마이크 권한이 필요합니다. 브라우저 설정에서 허용해 주세요.");
      return;
    }

    const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = async () => {
      // 스트림을 계속 열어두면 브라우저 탭에 마이크 사용 중 표시가 남는다.
      stream.getTracks().forEach((track) => track.stop());

      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
      setIsTranscribing(true);

      try {
        const text = await transcribeAudio(blob);
        setInput((prev) => (prev.trim() ? `${prev.trim()} ${text}` : text));
      } catch (err) {
        setNotice(err.message);
      } finally {
        setIsTranscribing(false);
      }
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleTranslate = async () => {
    const keyword = input.trim(); // [수정] " 억까" 처럼 공백이 섞여도 찾도록

    if (!keyword) {
      // [수정] alert 대신 화면 안에 안내를 띄운다.
      setNotice("번역할 신조어를 입력해 주세요.");
      return;
    }

    setNotice("");
    ///const translation = DICTIONARY.get(keyword) ?? NOT_FOUND;
    const result = await translate(keyword);
    if (result == null) return;
    if (result.found) {
      const translation = result.wordAnswers[0].meaning;
      setResult(translation);
      setWord(result.wordAnswers[0].word);
      setExample(result.wordAnswers[0].answer);

      setHistory((prev) => {
        // [수정] 같은 단어를 계속 누르면 기록이 똑같은 줄로 가득 찼다.
        const withoutDuplicate = prev.filter((item) => item.before !== keyword);
        return [
          { before: keyword, after: translation },
          ...withoutDuplicate,
        ].slice(0, MAX_HISTORY);
      });

      saveTranslation({
        originalText: keyword,
        translatedText: translation,
        explanation: result.wordAnswers[0].answer,
      }).catch(console.error);
    }
  };

  const handleKeyDown = (e) => {
    // Ctrl/Cmd + Enter 로 번역. 한글 조합 중에는 무시한다.
    if (
      e.key === "Enter" &&
      (e.ctrlKey || e.metaKey) &&
      !e.nativeEvent?.isComposing
    ) {
      e.preventDefault();
      handleTranslate();
    }
  };

  const copyResult = async () => {
    if (!result) return;

    /**
     * [수정] navigator.clipboard 는 HTTPS 또는 localhost 에서만 존재한다.
     * EC2 에 http 로 올리면 undefined 가 되어 TypeError 가 나는데,
     * 기존 코드는 그대로 "복사되었습니다" 를 띄워 사용자를 속이고 있었다.
     */
    try {
      if (!navigator.clipboard) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(result);
      setNotice("복사되었습니다.");
    } catch {
      setNotice(
        "이 브라우저에서는 자동 복사가 되지 않습니다. 직접 선택해 복사해 주세요.",
      );
    }
  };

  return (
    <div className="translate-page">
      <h1>✨ 신조어 번역</h1>

      <p className="translate-subtitle">어려운 신조어를 쉽게 이해해 보세요.</p>

      <div className="translate-box">
        {/* 입력 */}
        <div className="left">
          <div className="left-head">
            <h3>신조어 입력</h3>

            <button
              type="button"
              className={`mic-btn ${isRecording ? "recording" : ""}`}
              onClick={handleMicClick}
              disabled={isTranscribing}
              aria-label={isRecording ? "녹음 중지" : "음성으로 입력"}
              title={isRecording ? "녹음 중지" : "음성으로 입력"}
            >
              {isRecording ? <FaStop /> : <FaMicrophone />}
            </button>
          </div>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="번역할 신조어를 입력하거나 마이크 버튼으로 말해보세요. (Ctrl + Enter 로 번역)"
            aria-label="번역할 신조어"
          />

          {(isRecording || isTranscribing) && (
            <p className="mic-status" role="status">
              {isRecording ? "듣고 있어요... 다시 누르면 멈춰요." : "인식 중..."}
            </p>
          )}
        </div>

        {/* 결과 */}
        <div className="right">
          {/* <h3>번역 결과</h3> */}

          <div className="result_new">
            {result ? (
              <>
                {/* 신조어 */}
                <div className="word-area">
                  <div className="label">신조어</div>
                  <div className="word">{word}</div>
                </div>

                {/* 번역 결과 */}
                <div className="answer-area">
                  <div className="label">번역 결과</div>
                  <div className="answer">
                    <span>{result}</span>
                    <button
                      type="button"
                      className="copy-btn"
                      onClick={copyResult}
                      aria-label="번역 결과 복사"
                    >
                      <FaCopy />
                    </button>
                  </div>
                </div>

                {/* 예제 */}
                <div className="example-area">
                  <div className="label">예제</div>
                  <div className="example">{example}</div>
                </div>

                {/* <span>{result}</span>

                <button
                  type="button"
                  className="copy-btn"
                  onClick={copyResult}
                  aria-label="번역 결과 복사"
                >
                  <FaCopy />
                </button> */}
              </>
            ) : (
              "번역 결과가 표시됩니다."
            )}
          </div>
        </div>
      </div>

      {notice && (
        <p role="status" style={{ marginTop: 12, color: "var(--c-text-sub)" }}>
          {notice}
        </p>
      )}

      <button type="button" className="translate-btn" onClick={handleTranslate}>
        번역하기
        <FaArrowRight />
      </button>

      {/* 최근 기록 */}
      {history.length > 0 && (
        <div className="recent">
          <h2>최근 번역</h2>

          {history.map((item) => (
            <div className="history-item" key={item.before}>
              <span>{item.before}</span>
              <FaArrowRight />
              <span>{item.after}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Translate;
