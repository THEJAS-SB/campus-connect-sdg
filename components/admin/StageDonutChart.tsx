'use client'

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface StageCount {
  stage: string
  count: number
}

interface StageDonutChartProps {
  data: StageCount[]
}

const COLORS: Record<string, string> = {
  idea: '#64748b',
  mvp: '#3b82f6',
  revenue: '#f59e0b',
  funded: '#10b981',
  scaling: '#8b5cf6',
}

export default function StageDonutChart({ data }: StageDonutChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-white/20 text-sm text-slate-500">
        No startup data available yet.
      </div>
    )
  }

  const total = data.reduce((sum, d) => sum + Number(d.count), 0)

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <h3 className="mb-1 font-semibold text-white">Startup Stage Distribution</h3>
      <p className="mb-4 text-xs text-slate-400">{total} total startups</p>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={3}
            dataKey="count"
            nameKey="stage"
          >
            {data.map((entry) => (
              <Cell
                key={entry.stage}
                fill={COLORS[entry.stage] ?? '#6b7280'}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
            labelStyle={{ color: '#e2e8f0', textTransform: 'capitalize' }}
            itemStyle={{ color: '#a78bfa' }}
          />
          <Legend
            formatter={(value) => (
              <span className="capitalize text-slate-300 text-xs">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
