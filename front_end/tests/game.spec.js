import { test, expect } from "@playwright/test";
import { logTestResult } from "./utils/console-log.js";

/**
 * REQ-GAME-01: 신조어 게임 선택 허브.
 * QuizMain.jsx 는 정적 링크 카드만 렌더링하므로 백엔드 없이도 동작한다.
 */
test.describe("REQ-GAME-01: 게임 선택", () => {
  test("세 가지 게임 모드 카드가 렌더링된다", async ({ page }) => {
    await page.goto("/game");

    await expect(page.getByRole("heading", { name: /신조어 게임/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /뜻 맞추기/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /단어 맞추기/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /신조어 쓰기/ })).toBeVisible();
    await logTestResult(page, "REQ-GAME-01", "게임 선택 허브 3종 카드 렌더링 확인");
  });

  test("객관식 카드를 클릭하면 문제 화면으로 이동한다", async ({ page }) => {
    await page.goto("/game");

    await page.getByRole("link", { name: /뜻 맞추기/ }).click();

    await expect(page).toHaveURL(/\/game\/multiple$/);
    await logTestResult(page, "REQ-GAME-01", "객관식 카드 클릭 시 문제 화면으로 이동");
  });
});
