import { getStudentMentorMatches } from '@/app/actions/matchmaking'
import Navbar from '@/components/shared/Navbar'
import MenteeCard from '@/components/mentor/MenteeCard'

export const dynamic = 'force-dynamic'

export default async function StudentMatchesPage() {
  let matches: Awaited<ReturnType<typeof getStudentMentorMatches>> = []
  let error: string | null = null

  try {
    matches = await getStudentMentorMatches()
  } catch (e) {
    error = (e as Error).message
  }

  return (
    <div className="min-h-full">
      <Navbar title="Find Mentors" subtitle="AI-matched mentors for your startup" />
      <div className="p-6">
        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 p-4 text-sm text-red-400 ring-1 ring-red-500/20">
            Could not load matches: {error}. Complete your profile first.
          </div>
        )}

        {matches.length === 0 && !error ? (
          <div className="flex flex-col items-center py-16 text-center">
            <p className="text-3xl">🔍</p>
            <p className="mt-2 font-medium text-slate-300">No matches yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Complete your profile with skills and SDG interests to get AI-matched mentors.
            </p>
            <a
              href="/student/profile"
              className="mt-4 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400"
            >
              Complete Profile
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {matches.map((match) => (
              <MenteeCard
                key={match.profile.id}
                mentee={match.profile}
                compatibilityScore={match.similarity}
                reasoning={match.reasoning}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
