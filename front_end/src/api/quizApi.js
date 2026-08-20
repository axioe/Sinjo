import { apiUrl } from "./client";
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
  } catch {
    // 서버가 없을 때: 문제에 들어 있는 answer 와 직접 비교한다.
    // 공백을 지우고 비교해 "혼 밥" 처럼 띄어 쓴 답도 정답으로 처리한다.
    const expected = quiz.answer ?? quiz.word ?? "";
    return {
      correct: normalize(expected) === normalize(answer),
      correctAnswer: expected,
    };
  }
}
