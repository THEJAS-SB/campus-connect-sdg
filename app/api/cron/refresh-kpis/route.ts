import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [
    { count: totalUsers },
    { count: totalStartups },
    { data: fundingData },
    { data: scoreData },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('startups').select('id', { count: 'exact', head: true }),
    supabase.from('startups').select('funding_raised'),
    supabase.from('profiles').select('innovation_score'),
  ])

  const totalFunding = (fundingData ?? []).reduce(
    (sum, s) => sum + (s.funding_raised ?? 0),
    0
  )
  const cumulativeScore = (scoreData ?? []).reduce(
    (sum, p) => sum + (p.innovation_score ?? 0),
    0
  )

  await supabase.from('kpi_cache').upsert({
    id: 1,
    total_users: totalUsers ?? 0,
    total_startups: totalStartups ?? 0,
    total_funding: totalFunding,
    cumulative_score: cumulativeScore,
    updated_at: new Date().toISOString(),
  })

  return NextResponse.json({ success: true, updatedAt: new Date().toISOString() })
}
