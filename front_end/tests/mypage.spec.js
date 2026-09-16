import { test, expect } from "@playwright/test";
import { createAuthenticatedUser, loginInBrowser } from "./utils/auth.js";
import { logTestResult } from "./utils/console-log.js";

/**
 * REQ-MY-01: 마이페이지.
 * 로그인 폼을 매번 거치지 않고, API로 미리 인증 상태를 만든 뒤 화면만 검증한다
 * (로그인 폼 자체는 auth.spec.js 가 검증). 백엔드(:8080)가 실행 중이어야 한다.
 */
test.describe("REQ-MY-01: 마이페이지", () => {
  test("로그인한 사용자는 마이페이지에서 자신의 닉네임과 보유 포인트를 볼 수 있다", async ({
    page,
    context,
    request,
  }) => {
    const { nickname, token } = await createAuthenticatedUser(request);
    await loginInBrowser(context, token);

    await page.goto("/mypage");

    await expect(page.getByText(`${nickname} 님`)).toBeVisible();
    await expect(page.getByText("현재 보유 포인트")).toBeVisible();
    await logTestResult(page, "REQ-MY-01", "로그인 사용자 닉네임/보유 포인트 표시 확인");
  });
});
