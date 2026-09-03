import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { getSummary, getSignupTrend, getLoginTrend } from "../../api/adminApi";

const METRICS = [
  { key: "signups", label: "신규 가입", color: "#7c5cff" },
  { key: "logins",  label: "일일 접속", color: "#00b894" },
];

function AdminSummary() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  const [metric, setMetric] = useState("signups");
  const [trend, setTrend] = useState([]);
  const [trendLoading, setTrendLoading] = useState(true);

  useEffect(() => {
    getSummary().then(setSummary).catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    setTrendLoading(true);

    const fetcher = metric === "logins" ? getLoginTrend : getSignupTrend;

    fetcher(14)
      .then((data) => setTrend(data ?? []))
      .catch((err) => console.error("추이 조회 실패:", err))
      .finally(() => setTrendLoading(false));
  }, [metric]);

  if (error) return <p className="admin-error">{error}</p>;
  if (!summary) return <p className="admin-loading">불러오는 중...</p>;

  const cards = [
    { label: "전체 회원", value: summary.totalUsers, tone: "purple" },
    { label: "등록된 신조어", value: summary.totalWords, tone: "mint" },
    { label: "퀴즈 문항", value: summary.totalQuizzes, tone: "pink" },
  ];

  const current = METRICS.find((m) => m.key === metric);

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
        <div className="admin-chart-header">
          <h3 className="admin-chart-title">최근 14일 회원 통계</h3>

          <div className="admin-metric-tabs">
            {METRICS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={`admin-metric-tab ${metric === key ? "active" : ""}`}
                onClick={() => setMetric(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

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

              <Tooltip formatter={(value) => [`${value}명`, current.label]} />

              <Line
                type="monotone"
                dataKey="count"
                stroke={current.color}
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