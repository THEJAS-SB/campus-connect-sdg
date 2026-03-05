import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DailyMissions from '@/components/student/DailyMissions'

export default async function StudentMissionsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/sign-in')

  const { data: profile } = await supabase
    .from('profiles')
    .select('innovation_score, streak_count')
    .eq('id', user.id)
    .single()

  // Get today's active missions
  const { data: missions } = await supabase
    .from('missions')
    .select('*')
    .eq('student_id', user.id)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  // Get completed missions count
  const { count: completedCount } = await supabase
    .from('missions')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', user.id)
    .eq('is_completed', true)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white">Daily Missions ⚡</h1>
          <p className="mt-2 text-lg text-slate-400">
            Complete daily missions to earn XP and level up your Innovation Score!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-purple-600/5 p-6 backdrop-blur-sm">
            <div className="text-3xl font-bold text-white">
              {profile?.innovation_score || 0}
            </div>
            <div className="mt-1 text-sm text-slate-400">Total XP</div>
          </div>

          <div className="rounded-xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-orange-600/5 p-6 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🔥</span>
              <div className="text-3xl font-bold text-white">
                {profile?.streak_count || 0}
              </div>
            </div>
            <div className="mt-1 text-sm text-slate-400">Day Streak</div>
          </div>

          <div className="rounded-xl border border-green-500/20 bg-gradient-to-br from-green-500/10 to-green-600/5 p-6 backdrop-blur-sm">
            <div className="text-3xl font-bold text-white">
              {completedCount || 0}
            </div>
            <div className="mt-1 text-sm text-slate-400">
              Missions Completed
            </div>
          </div>
        </div>

        {/* Daily Missions Component */}
        <DailyMissions missions={missions || []} userId={user.id} />

        {/* How It Works */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
          <h2 className="mb-4 text-2xl font-bold text-white">
            How It Works 📖
          </h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-lg font-bold text-purple-400">
                1
              </div>
              <div>
                <h3 className="font-semibold text-white">
                  Get Personalized Missions
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  AI generates daily missions tailored to your startup stage and
                  goals
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-lg font-bold text-purple-400">
                2
              </div>
              <div>
                <h3 className="font-semibold text-white">Complete Tasks</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Finish missions to earn XP points and boost your Innovation
                  Score
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-lg font-bold text-purple-400">
                3
              </div>
              <div>
                <h3 className="font-semibold text-white">
                  Maintain Your Streak
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Log in daily and complete missions to build an unstoppable
                  streak!
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/20 text-lg font-bold text-purple-400">
                4
              </div>
              <div>
                <h3 className="font-semibold text-white">Level Up</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Unlock badges, level up your avatar, and get noticed by
                  mentors and investors
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pro Tips */}
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-6">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-yellow-300">
            <span>💡</span>
            Pro Tips
          </h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>• Complete all three daily missions to maximize your XP gain</li>
            <li>
              • Your streak multiplier increases rewards - don&apos;t break the chain!
            </li>
            <li>
              • Missions expire after 24 hours, so complete them before midnight
            </li>
            <li>
              • Higher Innovation Scores attract better mentor matches and
              investor attention
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
