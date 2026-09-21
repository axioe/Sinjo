import "../../css/mypage/TranslationLimit.css";
import { FaLanguage } from "react-icons/fa";

/**
 * 오늘의 번역 사용량 (REQ-TR 하루 번역 횟수 제한).
 * used/limit 이 아직 안 온(null) 상태에서는 0/0 으로 표시하지 않도록 안전한 기본값을 쓴다.
 */
function TranslationLimit({ used = 0, limit = 10 }) {
  const safeLimit = limit > 0 ? limit : 1;
  const remaining = Math.max(limit - used, 0);
  const percent = Math.min((used / safeLimit) * 100, 100);
  const reached = used >= limit;

  return (
    <section className="mypage-card mypage-translation-limit-card">
      <div className="mypage-card-head">
        <div>
          <span className="mypage-card-eyebrow">DAILY LIMIT</span>

          <h2 className="mypage-card-title">오늘의 번역 사용량</h2>
        </div>
      </div>

      <div className="mypage-translation-limit">
        <div className="mypage-translation-limit-icon">
          <FaLanguage />
        </div>

        <div className="mypage-translation-limit-info">
          <strong>
            {used}
            <small>/ {limit}건</small>
          </strong>

          <span
            className={
              reached ? "mypage-translation-limit-reached" : undefined
            }
          >
            {reached ? "오늘의 한도를 모두 사용했어요" : `남은 횟수 ${remaining}건`}
          </span>
        </div>
      </div>

      <div className="mypage-translation-limit-bar">
        <div
          className="mypage-translation-limit-bar-fill"
          style={{ width: `${percent}%` }}
        />
      </div>
    </section>
  );
}

export default TranslationLimit;
