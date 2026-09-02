import { apiUrl, request } from "./client";
import {
  MULTIPLE_CHOICE_SAMPLE,
  INITIAL_SOUND_SAMPLE,
  SUBJECTIVE_SAMPLE,
} from "../data/quizSampleData";

const BASE_URL = apiUrl("/api/quiz");

/** 퀴즈 종류. 백엔드 QuizDto.QuizType 과 문자열이 정확히 같아야 한다. */
export const QUIZ_TYPE = {
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
  INITIAL_SOUND: "INITIAL_SOUND",
  SUBJECTIVE: "SUBJECTIVE",
};

/**
 * 서버가 없거나 꺼져 있으면 샘플 데이터로 대체한다.
 *
 * [수정] 응답이 200 이어도 빈 배열이면 폴백을 쓴다.
 * quiz_word 테이블이 비어 있으면 서버는 정상적으로 [] 를 주는데,
 * 화면은 quizzes.length 가 0 이라 "문제를 불러오는 중..." 에서 영원히 멈춰 있었다.
 */
async function fetchQuizzes(path, fallback) {
  try {
    const res = await fetch(`${BASE_URL}${path}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      console.warn(`[quizApi] ${path} 응답이 비어 있습니다. 샘플 데이터를 사용합니다.`);
      return fallback;
    }
    return data;
  } catch (error) {
    console.warn(`[quizApi] 서버 응답 없음 (${path}). 샘플 데이터를 사용합니다.`, error);
    return fallback;
  }
}

export const getMultipleChoiceQuiz = () => fetchQuizzes("/multiple-choice", MULTIPLE_CHOICE_SAMPLE);
export const getInitialSoundQuiz = () => fetchQuizzes("/initial-sound", INITIAL_SOUND_SAMPLE);
export const getSubjectiveQuiz = () => fetchQuizzes("/subjective", SUBJECTIVE_SAMPLE);

const normalize = (value) => String(value ?? "").replace(/\s/g, "").toLowerCase();

/**
 * 정답 확인.
 *
 * [핵심 수정] 반환값을 { correct, correctAnswer } 로 통일했다.
 *
 * 세 개 퀴즈 화면은 이미 result.correct / feedback.correctAnswer 를 기대하도록
 * 고쳐져 있는데, 이 함수만 예전 그대로 result.isCorrect(서버에 없는 키)를 읽어
 * undefined 또는 boolean 을 돌려주고 있었다. 그래서
 *  - 서버가 켜져 있으면 : setFeedback(undefined) → feedback.correct 접근에서
 *                        "Cannot read properties of undefined" 로 화면이 죽고
 *  - 서버가 꺼져 있으면 : boolean 이 들어와 항상 오답 + "정답은 'undefined'" 로 표시됐다.
 * 즉 게임 세 개가 전부 채점되지 않는 상태였다.
 *
 * quizType 을 함께 보내야 백엔드가 종류에 맞게 채점한다.
 *
 * [수정] 로컬 채점 폴백은 quiz.answer 가 있을 때만 쓴다.
 * quiz.answer 는 quizSampleData.js(서버가 아예 꺼져 있을 때 쓰는 샘플)에만 있고,
 * 실제 백엔드가 내려주는 QuizDto.MultipleChoice/InitialSound/Subjective 는
 * 정답을 브라우저에 노출하지 않으려고 애초에 답을 안 담아 보낸다(MultipleChoice
 * 의 word 도 "뜻"이 아니라 "신조어"라 답 대신 쓸 수 없다). 그래서 이전에는
 * "문제는 정상 수신, /check 요청만 실패"하는 상황(예: 순간적인 네트워크 오류)에서
 * quiz.answer ?? quiz.word 가 전부 undefined 라 세 종류 다 무조건 오답 처리됐다 -
 * 사용자가 맞는 답을 냈어도 틀렸다고 나온 것이다. 정답을 알 방법이 없는 경우엔
 * 채점을 흉내 내지 않고 실패를 그대로 알려서, 화면이 다시 시도하도록 한다.
 */
export async function checkAnswer(quiz, answer, quizType) {
  try {
    const res = await fetch(`${BASE_URL}/check`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizId: quiz.id, answer, quizType }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const result = await res.json();
    return {
      correct: Boolean(result.correct),
      correctAnswer: result.correctAnswer ?? "",
    };
  } catch (error) {
    if (quiz.answer != null) {
      // 샘플 데이터: 문제 안에 정답이 그대로 들어 있으니 직접 비교한다.
      // 공백을 지우고 비교해 "혼 밥" 처럼 띄어 쓴 답도 정답으로 처리한다.
      const expected = quiz.answer;
      return {
        correct: normalize(expected) === normalize(answer),
        correctAnswer: expected,
      };
    }

    console.warn("[quizApi] 정답 확인 실패", error);
    throw new Error("정답 확인에 실패했습니다. 다시 시도해 주세요.");
  }
}

/**
 * 게임 결과 저장.
 *
 * 로그인 상태면 서버가 마이페이지 통계용으로 기록하고, 비로그인/서버 오류 시에는
 * 조용히 무시한다 - 결과 화면은 저장 성공 여부와 상관없이 항상 그대로 보여줘야 하므로
 * 에러를 던지지 않는다.
 */
export async function saveQuizAttempt(quizType, score, total) {
  try {
    await request("/api/quiz/attempts", {
      method: "POST",
      body: JSON.stringify({ quizType, score, total }),
    });
  } catch (error) {
    console.warn("[quizApi] 게임 결과 저장 실패", error);
  }
}

/**
 * 마이페이지 활동 요약의 "게임 플레이" 카드용 통계 조회.
 * 로그인하지 않았거나 조회에 실패하면 null 을 돌려준다 - 호출하는 쪽에서
 * null 이면 "준비 중" 카드로 대체 표시한다(ActivitySummary 의 ready 참고).
 */
export async function getMyQuizStats() {
  try {
    return await request("/api/quiz/stats");
  } catch (error) {
    console.warn("[quizApi] 게임 통계 조회 실패", error);
    return null;
  }
}

/**
 * 마이페이지 "게임 기록" 목록. translateApi.getMyTranslations 와 같은 패턴이다.
 * 실패하면 호출하는 쪽에서 처리하도록 그대로 던진다.
 */
export const getMyGameHistory = async (page = 0, size = 5) => {
  const list = await request(`/api/mypage/games?page=${page}&size=${size}`, {
    method: "GET",
  });

  return list.map((g) => ({
    id: g.id,
    quizType: g.quizType,
    score: g.score,
    total: g.total,
    createdAt: g.createdAt
      ? g.createdAt.slice(0, 16).replace("T", " ").replaceAll("-", ".")
      : "",
  }));
};
