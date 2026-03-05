import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateWeeklyEcosystemReport } from '@/lib/ai/groq'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [
    { count: totalStudents },
    { count: totalStartups },
    { data: domainData },
    { data: stageData },
    { data: fundingData },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('startups').select('id', { count: 'exact', head: true }),
    supabase.from('startups').select('domain').not('domain', 'is', null),
    supabase.rpc('get_stage_distribution'),
    supabase.from('startups').select('funding_raised'),
  ])

  // Calculate top domains
  const domainCounts: Record<string, number> = {}
  for (const s of domainData ?? []) {
    if (s.domain) domainCounts[s.domain] = (domainCounts[s.domain] ?? 0) + 1
  }
  const topDomains = Object.entries(domainCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([d]) => d)

  const stageCounts: Record<string, number> = {}
  for (const s of stageData ?? []) {
    stageCounts[s.stage] = Number(s.count)
  }

  const totalFunding = (fundingData ?? []).reduce(
    (sum, s) => sum + (s.funding_raised ?? 0),
    0
  )

  const reportContent = await generateWeeklyEcosystemReport({
    totalStudents: totalStudents ?? 0,
    totalStartups: totalStartups ?? 0,
    topDomains,
    stageCounts,
    totalFunding,
  })

  await supabase.from('ai_reports').insert({
    report_type: 'weekly_growth',
    content: reportContent,
  })

  return NextResponse.json({ success: true })
}
