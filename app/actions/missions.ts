'use server'

import { revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { generateDailyMissions } from '@/lib/ai/missions'

export async function fetchOrGenerateMissions() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const today = new Date().toISOString().split('T')[0]

  // Check if missions already exist for today
  const { data: existing } = await supabase
    .from('daily_missions')
    .select('*')
    .eq('student_id', user.id)
    .eq('date', today)

  if (existing && existing.length > 0) return existing

  // Fetch profile + startup for context
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, skills, innovation_score')
    .eq('id', user.id)
    .single()

  const { data: startup } = await supabase
    .from('startups')
    .select('name, stage')
    .eq('student_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const missions = await generateDailyMissions({
    studentName: profile?.full_name ?? 'Student',
    startupStage: startup?.stage ?? 'idea',
    startupName: startup?.name,
    skills: profile?.skills ?? [],
    innovationScore: profile?.innovation_score ?? 0,
  })

  const { data: inserted } = await supabase
    .from('daily_missions')
    .insert(missions.map((m) => ({ ...m, student_id: user.id, date: today })))
    .select()

  revalidateTag('missions')
  return inserted ?? []
}
