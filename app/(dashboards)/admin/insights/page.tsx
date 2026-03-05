import { generateEcosystemInsight } from '@/app/actions/admin'
import Navbar from '@/components/shared/Navbar'
import InsightReport from '@/components/admin/InsightReport'

export const dynamic = 'force-dynamic'

export default async function InsightsPage() {
  let report: string | null = null
  let error: string | null = null

  try {
    report = await generateEcosystemInsight()
  } catch (e) {
    error = (e as Error).message
  }

  return (
    <div className="min-h-full">
      <Navbar title="AI Strategic Insights" subtitle="Weekly strategic ecosystem analysis" />
      <div className="p-6">
        <div className="mb-4 rounded-lg bg-purple-500/5 p-4 ring-1 ring-purple-500/20">
          <p className="text-sm text-slate-300">
            Strategic analysis generated weekly by <strong className="text-purple-300">Groq Llama 3.3 70B</strong>.
            Analyzes platform activity, startup trends, and engagement metrics to surface actionable insights.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
            <p className="font-semibold">⚠️ Failed to generate insights</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        <div className="space-y-5">
          {report ? (
            <InsightReport report={report} />
          ) : !error ? (
            <div className="flex h-64 items-center justify-center text-slate-400">
              <p>Loading insights...</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
