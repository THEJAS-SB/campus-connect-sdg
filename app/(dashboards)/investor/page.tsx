import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/shared/Navbar'
import PipelineBoard from '@/components/investor/PipelineBoard'
import { getInvestorPipeline } from '@/app/actions/recommendations'

export const dynamic = 'force-dynamic'

export default async function InvestorDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: profile }, pipeline] = await Promise.all([
    supabase
      .from('profiles')
      .select('rs_id, full_name')
      .eq('id', user!.id)
      .single(),
    getInvestorPipeline(),
  ])

  const totalInvested = pipeline
    .filter((e) => e.pipeline_stage === 'invested')
    .reduce((sum, e) => sum + ((e.startups as { funding_raised: number } | null)?.funding_raised ?? 0), 0)

  return (
    <div className="min-h-full">
      <Navbar title="Investor Dashboard" subtitle={`RS ID: ${profile?.rs_id ?? ''}`} />
      <div className="p-6">
        {/* Welcome */}
        <div className="mb-6 rounded-xl border border-green-500/20 bg-gradient-to-r from-green-900/30 to-slate-900/30 p-5">
          <h2 className="text-lg font-semibold text-white">
            Welcome, {profile?.full_name?.split(' ')[0]} 💼
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Discover and track vetted campus startups.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Total Tracked', value: pipeline.length },
            { label: 'In Talks', value: pipeline.filter((e) => e.pipeline_stage === 'in_talks').length },
            { label: 'Due Diligence', value: pipeline.filter((e) => e.pipeline_stage === 'due_diligence').length },
            { label: 'Invested', value: pipeline.filter((e) => e.pipeline_stage === 'invested').length },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Pipeline Kanban */}
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-white">Investment Pipeline</h3>
            <a
              href="/investor/discover"
              className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-purple-700"
            >
              + Discover Startups
            </a>
          </div>
          <PipelineBoard initialPipeline={pipeline as Parameters<typeof PipelineBoard>[0]['initialPipeline']} />
        </div>
      </div>
    </div>
  )
}
