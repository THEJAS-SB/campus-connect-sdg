import { getAdminKPIs, getEcosystemCharts } from '@/app/actions/admin'
import Navbar from '@/components/shared/Navbar'
import KPICards from '@/components/admin/KPICards'
import EcosystemCharts from '@/components/admin/EcosystemCharts'

export const dynamic = 'force-dynamic'

export default async function AdminOverview() {
  const [kpis, charts] = await Promise.all([
    getAdminKPIs(),
    getEcosystemCharts(),
  ])

  if (!kpis) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-400">Failed to load dashboard data</p>
      </div>
    )
  }

  return (
    <div className="min-h-full">
      <Navbar
        title="Admin Intelligence Dashboard"
        subtitle="Real-time ecosystem monitoring"
      />
      <div className="p-6 space-y-6">
        {/* KPI Overview */}
        <div>
          <h2 className="mb-4 text-xl font-semibold text-white">Platform Overview</h2>
          <KPICards kpis={kpis} />
        </div>

        {/* Ecosystem Visualizations */}
        <div>
          <h2 className="mb-4 text-xl font-semibold text-white">Ecosystem Analytics</h2>
          <EcosystemCharts charts={charts} />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <a
            href="/admin/insights"
            className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-5 text-center transition hover:border-purple-500/50 hover:bg-purple-500/20"
          >
            <p className="text-2xl">🤖</p>
            <p className="mt-2 font-semibold text-white">AI Strategic Insights</p>
            <p className="mt-1 text-sm text-slate-400">
              Get weekly ecosystem report from Groq AI
            </p>
          </a>

          <a
            href="/admin/activity"
            className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-5 text-center transition hover:border-blue-500/50 hover:bg-blue-500/20"
          >
            <p className="text-2xl">📊</p>
            <p className="mt-2 font-semibold text-white">Activity Monitor</p>
            <p className="mt-1 text-sm text-slate-400">
              Real-time platform activity tracking
            </p>
          </a>
        </div>
      </div>
    </div>
  )
}
