import { defineConfig, devices } from "@playwright/test";

/**
 * 프론트엔드 E2E 테스트 설정.
 *
 * webServer 는 Playwright 가 알아서 `npm run dev` 를 띄우고 :5555 가 응답할 때까지
 * 기다려준다(vite.config.js 의 포트와 맞춰야 한다). 단, 백엔드(:8080)는 여기서
 * 띄워주지 않으므로 회원가입/로그인/마이페이지처럼 실제 API 를 호출하는 테스트는
 * 백엔드가 미리 실행되어 있어야 한다 - tests/utils/auth.js 참고.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  reporter: [["html", { open: "never" }], ["list"]],

  use: {
    baseURL: "http://localhost:5555",
    trace: "on-first-retry",
  },

  webServer: {
    command: "npm run dev",
    url: "http://localhost:5555",
    reuseExistingServer: !process.env.CI,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
