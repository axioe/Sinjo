/**
 * 백엔드 연동 전까지 쓰는 샘플 문제.
 * 서버가 꺼져 있으면 화면이 "로딩 중" 에서 멈춰 개발이 불가능하므로 폴백으로 둔다.
 * 서버가 붙으면 이 파일과 quizApi.js 의 폴백 부분만 지우면 된다.
 */

export const MULTIPLE_CHOICE_SAMPLE = [
  {
    id: 1,
    word: "억까",
    options: ["억지로 까다", "억지로 웃는 것", "억울해서 우는 것", "크게 화를 내는 것"],
    answer: "억지로 까다.",
  },
  {
    id: 2,
    word: "갓생",
    options: ["운이 좋은 인생", "부지런하고 계획적인 삶", "남에게 의지하는 삶", "즉흥적으로 사는 삶"],
    answer: "부지런하고 계획적인 삶",
  },
  {
    id: 3,
    word: "알잘딱깔센",
    options: ["알아서 잘 딱 깔끔하고 센스있게", "알고 보니 딱한 사정", "알쏭달쏭 깔끔한 센스", "알차고 딱 좋은 센스"],
    answer: "알아서 잘 딱 깔끔하고 센스있게",
  },
];

export const INITIAL_SOUND_SAMPLE = [
  { id: 101, initialSound: "ㅇㄲ", hint: "억지로 까다.", answer: "억까" },
  { id: 102, initialSound: "ㄱㅅ", hint: "계획적이고 알차게 사는 삶", answer: "갓생" },
  { id: 103, initialSound: "ㅋㅂㄴ", hint: "몹시 화가 난다는 뜻", answer: "킹받네" },
];

export const SUBJECTIVE_SAMPLE = [
  { id: 201, question: "'혼자 밥을 먹는 것'을 뜻하는 신조어는?", description: "두 글자입니다", answer: "혼밥" },
  { id: 202, question: "'맛이 매우 좋다'를 강조하는 신조어는?", description: "'존' 으로 시작하는 세 글자", answer: "존맛탱" },
  { id: 203, question: "'굉장히 열심히 산다'는 뜻으로 쓰는 신조어는?", description: "'갓' 으로 시작합니다", answer: "갓생" },
];

/** 신조어 이해도 테스트(메인 "TEST" 카드) 샘플. 객관식과 같은 형식(word/options/answer)을 쓴다. */
export const KNOWLEDGE_CHECK_SAMPLE = [
  { id: 301, word: "억까", options: ["억지로 까다", "억지로 웃는 것", "억울해서 우는 것", "크게 화를 내는 것"], answer: "억지로 까다" },
  { id: 302, word: "갓생", options: ["운이 좋은 인생", "부지런하고 계획적인 삶", "남에게 의지하는 삶", "즉흥적으로 사는 삶"], answer: "부지런하고 계획적인 삶" },
  { id: 303, word: "킹받네", options: ["매우 화가 난다", "매우 즐겁다", "몹시 피곤하다", "몹시 부럽다"], answer: "매우 화가 난다" },
  { id: 304, word: "혼밥", options: ["혼자 밥을 먹는 것", "함께 밥을 먹는 것", "밥을 거르는 것", "밥을 미리 준비하는 것"], answer: "혼자 밥을 먹는 것" },
  { id: 305, word: "존맛탱", options: ["맛이 매우 좋다", "맛이 별로다", "맵다", "양이 많다"], answer: "맛이 매우 좋다" },
  { id: 306, word: "알잘딱깔센", options: ["알아서 잘 딱 깔끔하고 센스있게", "알고 보니 딱한 사정", "알쏭달쏭 깔끔한 센스", "알차고 딱 좋은 센스"], answer: "알아서 잘 딱 깔끔하고 센스있게" },
  { id: 307, word: "TMI", options: ["너무 과한 정보", "타이밍이 중요함", "진짜 마음의 이야기", "totally my idea"], answer: "너무 과한 정보" },
  { id: 308, word: "가불기", options: ["피할 수 없는 상황", "가짜 불꽃놀이", "가불받는 것", "불규칙한 기분"], answer: "피할 수 없는 상황" },
  { id: 309, word: "완내스", options: ["완전 내 스타일", "완전 내숭", "완전 내향적", "완전 내려놓기"], answer: "완전 내 스타일" },
  { id: 310, word: "이생망", options: ["이번 생은 망했다", "이 생선은 맛있다", "이제 생각해보니 망설여진다", "이 생일은 망쳤다"], answer: "이번 생은 망했다" },
];
