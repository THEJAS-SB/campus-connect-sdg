import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/shared/Navbar'
import DomainChart from '@/components/mentor/DomainChart'

export const dynamic = 'force-dynamic'

export default async function MentorDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: profile }, { data: connections }, { data: domainStats }] = await Promise.all([
    supabase
      .from('profiles')
      .select('rs_id, full_name, innovation_score, skills')
      .eq('id', user!.id)
      .single(),
    supabase
      .from('mentorship_connections')
      .select('id, status, student_id, profiles!mentorship_connections_student_id_fkey(full_name, rs_id)')
      .eq('mentor_id', user!.id),
    supabase.rpc('get_mentor_domain_stats', { p_mentor_id: user!.id }),
  ])

  const activeCount = connections?.filter((c) => c.status === 'active').length ?? 0
  const pendingCount = connections?.filter((c) => c.status === 'pending').length ?? 0

  return (
    <div className="min-h-full">
      <Navbar title="Mentor Dashboard" subtitle={`RS ID: ${profile?.rs_id ?? ''}`} />

      <div className="p-6">
        {/* Welcome */}
        <div className="mb-6 rounded-xl border border-blue-500/20 bg-gradient-to-r from-blue-900/30 to-slate-900/30 p-5">
          <h2 className="text-lg font-semibold text-white">
            Hello, {profile?.full_name?.split(' ')[0]} 🧑‍🏫
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            You are shaping the next wave of campus innovators.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <p className="text-2xl font-bold text-white">{activeCount}</p>
            <p className="text-xs text-slate-400">Active Mentees</p>
          </div>
          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
            <p className="text-2xl font-bold text-white">{pendingCount}</p>
            <p className="text-xs text-slate-400">Pending Requests</p>
          </div>
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
            <p className="text-2xl font-bold text-white">{domainStats?.length ?? 0}</p>
            <p className="text-xs text-slate-400">Domains Covered</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Domain Chart */}
          <DomainChart data={domainStats ?? []} />

          {/* Pending connections */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h3 className="mb-4 font-semibold text-white">Recent Connection Requests</h3>
            {pendingCount === 0 ? (
              <p className="text-sm text-slate-500">
                No pending requests.{' '}
                <a href="/mentor/suggested" className="text-purple-400 underline">
                  Browse suggested mentees
                </a>
              </p>
            ) : (
              <ul className="space-y-3">
                {connections
                  ?.filter((c) => c.status === 'pending')
                  .map((conn) => (
                    <li
                      key={conn.id}
                      className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3 ring-1 ring-white/10"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">
                          {(conn.profiles as { full_name: string; rs_id: string } | null)?.full_name ??
                            'Unknown'}
                        </p>
                        <p className="text-xs font-mono text-slate-500">
                          {(conn.profiles as { full_name: string; rs_id: string } | null)?.rs_id}
                        </p>
                      </div>
                      <span className="rounded-full bg-yellow-500/10 px-2.5 py-0.5 text-xs font-medium text-yellow-400 ring-1 ring-yellow-500/30">
                        Pending
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>

        {/* Quick nav */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <a
            href="/mentor/suggested"
            className="rounded-xl border border-white/10 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 p-5 transition hover:border-purple-500/30"
          >
            <p className="text-xl">🎯</p>
            <p className="mt-2 font-semibold text-white">Suggested Mentees</p>
            <p className="mt-1 text-xs text-slate-400">
              AI-matched students who align with your expertise
            </p>
          </a>
          <a
            href="/mentor/meetings"
            className="rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-5 transition hover:border-blue-500/30"
          >
            <p className="text-xl">📅</p>
            <p className="mt-2 font-semibold text-white">Meeting Scheduler</p>
            <p className="mt-1 text-xs text-slate-400">
              Schedule sessions and generate WhatsApp links
            </p>
          </a>
        </div>
      </div>
    </div>
  )
}
