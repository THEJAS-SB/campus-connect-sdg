"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from "recharts";

interface EcosystemChartsProps {
  charts: {
    stage_distribution: Record<string, number>;
    connections_by_domain: Record<string, number>;
    weekly_trends: Record<string, Record<string, number>>;
  };
}

const STAGE_COLORS: Record<string, string> = {
  idea: "#94a3b8",
  mvp: "#60a5fa",
  revenue: "#fbbf24",
  funded: "#34d399",
  scaling: "#a78bfa",
};

const DOMAIN_COLORS = [
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#14b8a6",
  "#f59e0b",
  "#06b6d4",
  "#84cc16",
  "#6366f1",
];

export default function EcosystemCharts({ charts }: EcosystemChartsProps) {
  // Format stage distribution for pie chart
  const stageData = Object.entries(charts.stage_distribution).map(
    ([stage, count]) => ({
      name: stage.charAt(0).toUpperCase() + stage.slice(1),
      value: count,
      fill: STAGE_COLORS[stage] ?? "#94a3b8",
    }),
  );

  // Format domain connections for bar chart
  const domainData = Object.entries(charts.connections_by_domain)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([domain, count], i) => ({
      domain: domain.length > 15 ? domain.slice(0, 15) + "..." : domain,
      connections: count,
      fill: DOMAIN_COLORS[i % DOMAIN_COLORS.length],
    }));

  // Format weekly trends for line chart
  const weeklyData = Object.entries(charts.weekly_trends)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, domains]) => ({
      week: new Date(week).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      ...domains,
    }));

  const topDomains = [
    ...new Set(
      Object.values(charts.weekly_trends)
        .flatMap((w) => Object.entries(w))
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([domain]) => domain),
    ),
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Startup Stage Distribution (Pie Chart) */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">
          Startup Stage Distribution
        </h3>
        {stageData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stageData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                outerRadius={80}
                dataKey="value"
              >
                {stageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-sm text-slate-500">
            No startup data yet
          </div>
        )}
      </div>

      {/* Mentorship Connections by Domain (Bar Chart) */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
        <h3 className="mb-4 text-sm font-semibold text-white">
          Mentorship Connections by Domain
        </h3>
        {domainData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={domainData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
              />
              <XAxis
                dataKey="domain"
                tick={{ fill: "#94a3b8", fontSize: 11 }}
                angle={-15}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="connections" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-sm text-slate-500">
            No connection data yet
          </div>
        )}
      </div>

      {/* Trending Domains Over Time (Line Chart) */}
      <div className="col-span-1 rounded-xl border border-white/10 bg-white/5 p-5 lg:col-span-2">
        <h3 className="mb-4 text-sm font-semibold text-white">
          Startup Creation Trends (Last 30 Days)
        </h3>
        {weeklyData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
              />
              <XAxis dataKey="week" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              {topDomains.slice(0, 5).map((domain, i) => (
                <Line
                  key={domain}
                  type="monotone"
                  dataKey={domain}
                  stroke={DOMAIN_COLORS[i % DOMAIN_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-sm text-slate-500">
            No trend data yet (needs 30 days of activity)
          </div>
        )}
      </div>
    </div>
  );
}
