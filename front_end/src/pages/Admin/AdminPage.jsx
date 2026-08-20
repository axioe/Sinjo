import { useState } from "react";
import AdminSummary from "./AdminSummary";
import AdminWords from "./AdminWords";
import AdminUsers from "./AdminUsers";
import "../../css/Admin.css";

/**
 * 관리자 페이지 (REQ-ADM-01)
 * 화면구조 가이드라인 7장: 좌측 사이드 메뉴 + 우측 콘텐츠 영역
 */
const MENUS = [
  { key: "summary", label: "대시보드", icon: "📊" },
  { key: "words", label: "용어 관리", icon: "📖" },
  { key: "users", label: "회원 관리", icon: "👥" },
];

function AdminPage() {
  const [menu, setMenu] = useState("summary");

  return (
    <div className="admin">
      <aside className="admin-sidebar">
        <p className="admin-sidebar-title">관리자 메뉴</p>
        {MENUS.map(({ key, label, icon }) => (
          <button
            key={key}
            type="button"
            className={`admin-menu-item ${menu === key ? "active" : ""}`}
            onClick={() => setMenu(key)}
          >
            <span aria-hidden="true">{icon}</span>
            {label}
          </button>
        ))}
      </aside>

      <section className="admin-content">
        {menu === "summary" && <AdminSummary />}
        {menu === "words" && <AdminWords />}
        {menu === "users" && <AdminUsers />}
      </section>
    </div>
  );
}

export default AdminPage;
