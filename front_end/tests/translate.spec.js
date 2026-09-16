import { test, expect } from "@playwright/test";
import { logTestResult } from "./utils/console-log.js";

/**
 * REQ-TR-01: 신조어 번역 화면.
 * 실제 검색 결과(신조어 DB 매칭)는 시드 데이터에 의존하므로 다루지 않는다 -
 * 화면 렌더링과 클라이언트 쪽 입력 검증만 검증한다.
 */
test.describe("REQ-TR-01: 신조어 번역", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/translate");
  });

  test("입력창과 번역 버튼이 렌더링된다", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "✨ 신조어 번역" })).toBeVisible();
    await expect(page.getByLabel("번역할 신조어")).toBeVisible();
    await expect(page.getByRole("button", { name: "번역하기" })).toBeVisible();
    await logTestResult(page, "REQ-TR-01", "번역 화면 입력창/버튼 렌더링 확인");
  });

  test("빈 값으로 번역하면 안내 문구를 보여준다", async ({ page }) => {
    await page.getByRole("button", { name: "번역하기" }).click();

    await expect(page.getByText("번역할 신조어를 입력해 주세요.")).toBeVisible();
    await logTestResult(page, "REQ-TR-01", "빈 값 번역 시도 시 안내 문구 표시");
  });
});
