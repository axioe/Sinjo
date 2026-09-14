import { test, expect } from "@playwright/test";

/**
 * REQ-AUTH-01: 회원가입 / 로그인 / 접근 제어.
 * 백엔드(:8080)가 실행 중이어야 한다 - 회원가입/로그인은 실제 API를 호출한다.
 */

test.describe("REQ-AUTH-01: 회원가입", () => {
  test("정상적으로 가입하면 로그인 화면으로 이동한다", async ({ page }) => {
    const email = `e2e_signup_${Date.now()}@example.com`;

    await page.goto("/signup");
    page.on("dialog", (dialog) => dialog.accept());

    await page.getByPlaceholder("example@email.com").fill(email);
    await page.getByPlaceholder("닉네임 (2~30자)").fill("가입테스트");
    await page.getByPlaceholder("8자 이상 비밀번호").fill("Test1234!");
    await page.getByPlaceholder("비밀번호 확인").fill("Test1234!");
    await page.getByRole("button", { name: "가입하기" }).click();

    await expect(page).toHaveURL(/\/login$/);
  });

  test("비밀번호 확인이 다르면 가입하지 않고 안내한다", async ({ page }) => {
    // 클라이언트 쪽 검증(Signup.jsx validate())만으로 걸러지므로 백엔드 상태와 무관하다.
    await page.goto("/signup");

    await page.getByPlaceholder("example@email.com").fill("mismatch@example.com");
    await page.getByPlaceholder("닉네임 (2~30자)").fill("테스터");
    await page.getByPlaceholder("8자 이상 비밀번호").fill("Test1234!");
    await page.getByPlaceholder("비밀번호 확인").fill("Different1!");
    await page.getByRole("button", { name: "가입하기" }).click();

    await expect(page.getByText("비밀번호가 일치하지 않습니다.")).toBeVisible();
    await expect(page).toHaveURL(/\/signup$/);
  });
});

test.describe("REQ-AUTH-01: 로그인", () => {
  test("가입한 계정으로 로그인하면 헤더에 닉네임이 표시된다", async ({ page }) => {
    const email = `e2e_login_${Date.now()}@example.com`;

    await page.goto("/signup");
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByPlaceholder("example@email.com").fill(email);
    await page.getByPlaceholder("닉네임 (2~30자)").fill("로그인테스트");
    await page.getByPlaceholder("8자 이상 비밀번호").fill("Test1234!");
    await page.getByPlaceholder("비밀번호 확인").fill("Test1234!");
    await page.getByRole("button", { name: "가입하기" }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.getByLabel("이메일").fill(email);
    await page.getByLabel("비밀번호").fill("Test1234!");
    await page.getByRole("button", { name: "로그인", exact: true }).click();

    await expect(page.getByText("로그인테스트님")).toBeVisible();
  });

  test("존재하지 않는 계정으로 로그인하면 오류 문구를 보여준다", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("이메일").fill("no-such-user@example.com");
    await page.getByLabel("비밀번호").fill("wrongpassword");
    await page.getByRole("button", { name: "로그인", exact: true }).click();

    await expect(page.locator(".login-error")).toBeVisible();
  });
});

test.describe("REQ-AUTH-01: 접근 제어", () => {
  // RequireAuth/RequireAdmin(프론트) 검증 - 실제 차단은 백엔드 SecurityConfig가 한다
  // (back_end SecurityAuthTest 참고). 토큰이 없으면 useAuth가 API를 호출하지 않고
  // 바로 loading=false, user=null 이 되므로 백엔드 없이도 동작한다.

  test("비로그인 상태로 마이페이지에 가면 로그인 화면으로 보낸다", async ({ page }) => {
    await page.goto("/mypage");

    await expect(page).toHaveURL(/\/login$/);
  });

  test("비로그인 상태로 관리자 페이지에 가면 로그인 화면으로 보낸다", async ({ page }) => {
    await page.goto("/admin");

    await expect(page).toHaveURL(/\/login$/);
  });
});
