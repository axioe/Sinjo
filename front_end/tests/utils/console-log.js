/**
 * 시연 영상용: 테스트가 통과한 시점에 실제 브라우저 콘솔(DevTools > Console)에
 * REQ-ID와 검증 내용을 배지 스타일로 출력한다.
 *
 * page.evaluate로 실행하기 때문에 headed 모드(--headed)로 테스트를 돌리면
 * 화면 녹화 중 DevTools 콘솔에 실시간으로 로그가 찍히는 걸 보여줄 수 있다.
 * assert가 실패하면 이 함수 호출 전에 테스트가 이미 멈추므로, 이 로그는
 * "해당 시나리오의 실행 검증이 통과했다"는 의미로만 찍힌다.
 */
export async function logTestResult(page, reqId, description) {
  await page.evaluate(
    ({ reqId, description }) => {
      console.log(
        "%c PASS %c%s %c%s",
        "background:#16a34a;color:#fff;font-weight:bold;padding:2px 6px;border-radius:4px 0 0 4px;",
        "background:#1f2937;color:#fff;font-weight:bold;padding:2px 6px;",
        reqId,
        "color:#1f2937;padding:2px 0 2px 6px;",
        description,
      );
    },
    { reqId, description },
  );
}
