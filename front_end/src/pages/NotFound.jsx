import { Link } from "react-router-dom";

/**
 * [신규] 없는 주소로 들어왔을 때 보여줄 화면.
 * 예전에는 매칭되는 Route 가 없으면 헤더·푸터만 남고 본문이 텅 비었다.
 */
function NotFound() {
  return (
    <div style={{ padding: "80px 0", textAlign: "center" }}>
      <h1 style={{ fontSize: 48, marginBottom: 12 }}>404</h1>
      <p style={{ marginBottom: 24, color: "var(--c-text-sub)" }}>
        찾으시는 페이지가 없어요. 주소를 다시 확인해 주세요.
      </p>
      <Link to="/" style={{ color: "var(--c-primary)", fontWeight: 700 }}>
        메인으로 돌아가기
      </Link>
    </div>
  );
}

export default NotFound;
