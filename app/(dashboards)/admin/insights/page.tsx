import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/shared/Navbar'
import InsightReport from '@/components/admin/InsightReport'

export const dynamic = 'force-dynamic'

export default async function InsightsPage() {
  const supabase = await createClient()

  const { data: reports } = await supabase
    .from('ai_reports')
    .select('*')
    .eq('report_type', 'weekly_growth')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="min-h-full">
      <Navbar title="AI Growth Insights" subtitle="Weekly strategic ecosystem analysis" />
      <div className="p-6">
        <div className="mb-4 rounded-lg bg-purple-500/5 p-4 ring-1 ring-purple-500/20">
          <p className="text-sm text-slate-300">
            These reports are generated every Monday by <strong className="text-purple-300">Groq Llama 3.3 70B</strong>.
            They analyse anonymised ecosystem data to surface strategic recommendations for institutional leadership.
          </p>
        </div>

        <div className="space-y-5">
          {(reports ?? []).map((report, i) => (
            <InsightReport key={report.id} report={report} />
          ))}
          {!reports || reports.length === 0 ? (
            <InsightReport report={null} />
          ) : null}
        </div>
      </div>
    </div>
  )
}
