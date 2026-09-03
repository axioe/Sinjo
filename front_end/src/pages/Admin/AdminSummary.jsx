import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { getSummary, getSignupTrend } from "../../api/adminApi";

function AdminSummary() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  const [trend, setTrend] = useState([]);
  const [trendLoading, setTrendLoading] = useState(true);

  useEffect(() => {
    getSummary().then(setSummary).catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    getSignupTrend(14)
      .then((data) => setTrend(data ?? []))
      .catch((err) => console.error("가입 추이 조회 실패:", err))
      .finally(() => setTrendLoading(false));
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

      <section className="admin-chart-card">
        <h3 className="admin-chart-title">최근 14일 신규 가입자</h3>

        {trendLoading ? (
          <p className="admin-loading">불러오는 중...</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={trend}
              margin={{ top: 10, right: 20, bottom: 0, left: -10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />

              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(v) => v.slice(5)}
              />

              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />

              <Tooltip formatter={(value) => [`${value}명`, "가입자"]} />

              <Line
                type="monotone"
                dataKey="count"
                stroke="#7c5cff"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </section>
    </>
  );
}

export default AdminSummary;