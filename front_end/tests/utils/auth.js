/**
 * E2E 테스트용 인증 헬퍼.
 *
 * 마이페이지처럼 로그인이 전제인 화면을 검증할 때, 매번 로그인 폼을 거치면 느리고
 * 로그인 자체의 성공 여부에 다른 화면 테스트가 종속된다. 로그인 폼 자체는
 * tests/auth.spec.js 가 이미 UI로 검증하므로, 여기서는 회원가입/로그인 API를 직접
 * 호출해 토큰만 빠르게 만든다.
 */

/** front_end/src/api/client.js 의 기본값과 동일. CI 등 다른 환경이면 API_BASE_URL 로 덮어쓴다. */
const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:8080";

/**
 * 매번 새 이메일로 회원가입 + 로그인해 토큰을 발급받는다.
 * requestContext 는 Playwright 테스트의 `request` 픽스처를 그대로 넘기면 된다.
 */
export async function createAuthenticatedUser(requestContext) {
  const email = `e2e_${Date.now()}_${Math.floor(Math.random() * 10000)}@example.com`;
  const password = "Test1234!";
  const nickname = "e2e테스터";

  await requestContext.post(`${API_BASE_URL}/api/users/signup`, {
    data: { email, password, nickname },
  });

  const loginRes = await requestContext.post(`${API_BASE_URL}/api/users/login`, {
    data: { email, password },
  });

  if (!loginRes.ok()) {
    throw new Error(
      `E2E 테스트용 로그인 실패 (${loginRes.status()}) - 백엔드(${API_BASE_URL})가 실행 중인지 확인하세요.`,
    );
  }

  const body = await loginRes.json();
  return { email, password, nickname, token: body.token, user: body.user };
}

/**
 * localStorage 에 토큰을 심어 로그인 상태로 페이지를 연다.
 * client.js 의 TOKEN_KEY("token")와 반드시 같은 키를 써야 한다.
 */
export async function loginInBrowser(context, token) {
  await context.addInitScript((t) => {
    window.localStorage.setItem("token", t);
  }, token);
}
