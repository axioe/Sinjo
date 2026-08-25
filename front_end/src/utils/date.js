/**
 * date 를 로컬 기준 "yyyy-MM-dd" 문자열로 만든다.
 * Date.toISOString() 은 UTC 기준이라 한국 시간 자정 근처에서 날짜가 하루 밀릴 수 있다.
 */
export function toLocalDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
