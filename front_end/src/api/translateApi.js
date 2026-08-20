import { request } from "./client";

/**
 * [수정] 쓰이지 않는 axios 인스턴스가 서버 주소를 또 하드코딩하고 있었다.
 *
 * 이 파일은 현재 어느 화면에서도 import 하지 않는다(죽은 코드).
 * 그래도 남겨 두면 나중에 번역 기능을 붙이는 사람이 그대로 가져다 쓰면서
 * 배포 시 주소를 못 바꾸는 문제가 반복된다.
 * 공통 request 를 쓰도록 바꾸고, 앞으로 붙일 API 자리를 표시해 둔다.
 *
 * 참고: 지금은 프로젝트에서 axios 를 아무 데도 쓰지 않는다.
 * 정리할 때 package.json 에서 axios 의존성을 빼도 된다.
 */

/** TODO: 백엔드에 번역 API 가 생기면 주소를 맞춘다. (예: POST /api/translate) */
export const translate = (payload) =>
  request("/api/translate", { method: "POST", body: JSON.stringify(payload) });

export default { translate };
