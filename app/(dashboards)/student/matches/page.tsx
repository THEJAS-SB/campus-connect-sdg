import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function StudentMatchesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/sign-in')

  // Get suggested mentors (matches with high compatibility)
  const { data: matches } = await supabase
    .from('matches')
    .select(`
      *,
      mentor:profiles!mentor_id (
        rs_id,
        full_name,
        avatar_url,
        skills,
        bio,
        institution
      )
    `)
    .eq('student_id', user.id)
    .order('compatibility_score', { ascending: false })
    .limit(10)

  // Get accepted matches
  const { data: connections } = await supabase
    .from('matches')
    .select(`
      *,
      mentor:profiles!mentor_id (
        rs_id,
        full_name,
        avatar_url,
        institution
      )
    `)
    .eq('student_id', user.id)
    .eq('status', 'active')

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white">Find Mentors 🤝</h1>
          <p className="mt-2 text-lg text-slate-400">
            Connect with experienced mentors who can guide your innovation journey
          </p>
        </div>

        {/* Your Connections */}
        {connections && connections.length > 0 && (
          <div>
            <h2 className="mb-4 text-2xl font-bold text-white">
              Your Mentors ({connections.length})
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {connections.map((match: any) => (
                <div
                  key={match.id}
                  className="rounded-xl border border-green-500/20 bg-gradient-to-br from-green-500/10 to-green-600/5 p-6 backdrop-blur-sm"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-green-500/20 to-green-600/20">
                      {match.mentor.avatar_url ? (
                        <img
                          src={match.mentor.avatar_url}
                          alt={match.mentor.full_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl">
                          👤
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">
                        {match.mentor.full_name || 'Mentor'}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {match.mentor.institution || 'Institution'}
                      </p>
                      <p className="mt-1 text-xs text-green-400">
                        ✓ Connected
                      </p>
                    </div>
                  </div>
                  <button className="mt-4 w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700">
                    Message
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Mentors */}
        <div>
          <h2 className="mb-4 text-2xl font-bold text-white">
            Suggested Mentors
          </h2>
          {matches && matches.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {matches.map((match: any) => (
                <div
                  key={match.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
                >
                  <div className="flex items-start gap-6">
                    {/* Mentor Avatar */}
                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                      {match.mentor.avatar_url ? (
                        <img
                          src={match.mentor.avatar_url}
                          alt={match.mentor.full_name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-4xl">
                          👤
                        </div>
                      )}
                    </div>

                    {/* Mentor Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-white">
                            {match.mentor.full_name || 'Mentor'}
                          </h3>
                          <p className="text-sm text-slate-400">
                            {match.mentor.institution || 'Institution'}
                          </p>
                        </div>
                        <div className="rounded-full bg-purple-500/20 px-3 py-1">
                          <span className="text-sm font-bold text-purple-400">
                            {Math.round(match.compatibility_score || 0)}% Match
                          </span>
                        </div>
                      </div>

                      {/* Mentor Bio */}
                      {match.mentor.bio && (
                        <p className="mt-3 text-sm text-slate-400">
                          {match.mentor.bio}
                        </p>
                      )}

                      {/* Skills */}
                      {match.mentor.skills && match.mentor.skills.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {match.mentor.skills.slice(0, 4).map((skill: string) => (
                            <span
                              key={skill}
                              className="rounded-full bg-blue-500/20 px-3 py-1 text-xs text-blue-300"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* AI Reasoning */}
                      {match.reasoning && (
                        <div className="mt-4 rounded-lg border border-purple-500/20 bg-purple-500/10 p-3">
                          <h4 className="mb-1 text-xs font-semibold text-purple-300">
                            Why this match?
                          </h4>
                          <p className="text-xs text-slate-400">
                            {match.reasoning}
                          </p>
                        </div>
                      )}

                      {/* Connect Button */}
                      <button
                        className={`mt-4 w-full rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${
                          match.status === 'pending'
                            ? 'bg-yellow-600 hover:bg-yellow-700'
                            : match.status === 'active'
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-purple-600 hover:bg-purple-700'
                        }`}
                      >
                        {match.status === 'pending'
                          ? 'Request Pending'
                          : match.status === 'active'
                          ? 'Connected'
                          : 'Connect'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-12 text-center backdrop-blur-sm">
              <div className="text-6xl">🔍</div>
              <h3 className="mt-4 text-xl font-bold text-white">
                No Mentors Found Yet
              </h3>
              <p className="mt-2 text-slate-400">
                Our AI is analyzing your profile and will suggest compatible mentors
                soon. Make sure your startup details are complete!
              </p>
              <button className="mt-6 rounded-lg bg-purple-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-purple-700">
                Complete Your Profile
              </button>
            </div>
          )}
        </div>

        {/* How Matching Works */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
          <h2 className="mb-4 text-2xl font-bold text-white">
            How Our AI Matching Works 🤖
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-3 text-4xl">🎯</div>
              <h3 className="font-semibold text-white">Smart Analysis</h3>
              <p className="mt-2 text-sm text-slate-400">
                We analyze your startup domain, skills, and SDG alignment
              </p>
            </div>
            <div className="text-center">
              <div className="mb-3 text-4xl">🔗</div>
              <h3 className="font-semibold text-white">Compatibility Scoring</h3>
              <p className="mt-2 text-sm text-slate-400">
                AI calculates compatibility based on expertise overlap
              </p>
            </div>
            <div className="text-center">
              <div className="mb-3 text-4xl">💬</div>
              <h3 className="font-semibold text-white">Explainable Matches</h3>
              <p className="mt-2 text-sm text-slate-400">
                Every suggestion comes with clear reasoning
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
