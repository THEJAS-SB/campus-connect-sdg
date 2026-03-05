import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/shared/Navbar'
import KpiCard from '@/components/admin/KpiCard'
import StageDonutChart from '@/components/admin/StageDonutChart'
import InsightReport from '@/components/admin/InsightReport'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [
    { data: profile },
    { data: kpiCache },
    { data: stageData },
    { data: latestReport },
  ] = await Promise.all([
    supabase.from('profiles').select('rs_id, full_name').eq('id', user!.id).single(),
    supabase.from('kpi_cache').select('*').eq('id', 1).single(),
    supabase.rpc('get_stage_distribution'),
    supabase
      .from('ai_reports')
      .select('*')
      .eq('report_type', 'weekly_growth')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  return (
    <div className="min-h-full">
      <Navbar title="Admin Intelligence" subtitle={`RS ID: ${profile?.rs_id ?? ''}`} />

      <div className="p-6">
        {/* Welcome */}
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-900/20 to-slate-900/30 p-5">
          <h2 className="text-lg font-semibold text-white">
            Welcome, {profile?.full_name?.split(' ')[0]} 🏛️
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Here&apos;s a real-time view of your institution&apos;s innovation ecosystem.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <KpiCard
            label="Total RS IDs"
            value={(kpiCache?.total_users ?? 0).toLocaleString()}
            icon="🪪"
            description="Active users across all roles"
            color="purple"
          />
          <KpiCard
            label="Total Startups"
            value={(kpiCache?.total_startups ?? 0).toLocaleString()}
            icon="🚀"
            color="blue"
          />
          <KpiCard
            label="Cumulative Score"
            value={(kpiCache?.cumulative_score ?? 0).toLocaleString()}
            icon="⚡"
            description="Sum of all Innovation Scores"
            color="orange"
          />
          <KpiCard
            label="Total Funding"
            value={`$${(kpiCache?.total_funding ?? 0).toLocaleString()}`}
            icon="💰"
            description="Across all funded startups"
            color="green"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Donut Chart */}
          <StageDonutChart data={stageData ?? []} />

          {/* AI Report preview */}
          <InsightReport report={latestReport} />
        </div>

        {/* Quick nav */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <a href="/admin/ecosystem" className="rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-purple-500/30">
            <p className="text-xl">🌐</p>
            <p className="mt-2 font-medium text-white">Ecosystem Health</p>
            <p className="mt-1 text-xs text-slate-400">Live charts and trends</p>
          </a>
          <a href="/admin/insights" className="rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-purple-500/30">
            <p className="text-xl">🤖</p>
            <p className="mt-2 font-medium text-white">AI Insights</p>
            <p className="mt-1 text-xs text-slate-400">Weekly strategic reports</p>
          </a>
          <a href="/admin/users" className="rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-purple-500/30">
            <p className="text-xl">👥</p>
            <p className="mt-2 font-medium text-white">User Management</p>
            <p className="mt-1 text-xs text-slate-400">View all RS ID holders</p>
          </a>
        </div>
      </div>
    </div>
  )
}
