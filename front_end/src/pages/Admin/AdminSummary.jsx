import { useState, useEffect } from "react";
import { getSummary } from "../../api/adminApi";

function AdminSummary() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getSummary().then(setSummary).catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="admin-error">{error}</p>;
  if (!summary) return <p className="admin-loading">불러오는 중...</p>;

  const cards = [
    { label: "전체 회원", value: summary.totalUsers, tone: "purple" },
    { label: "등록된 신조어", value: summary.totalWords, tone: "mint" },
    { label: "퀴즈 문항", value: summary.totalQuizzes, tone: "pink" },
  ];

  return (
    <>
      <h1 className="admin-title">대시보드</h1>

      <div className="admin-stat-grid">
        {cards.map(({ label, value, tone }) => (
          <div key={label} className={`admin-stat ${tone}`}>
            <p className="admin-stat-label">{label}</p>
            <p className="admin-stat-value">{value.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </>
  );
}

export default AdminSummary;
