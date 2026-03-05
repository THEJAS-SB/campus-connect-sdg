import { getMenteeSuggestions } from '@/app/actions/matchmaking'
import Navbar from '@/components/shared/Navbar'
import MenteeCard from '@/components/mentor/MenteeCard'

export const dynamic = 'force-dynamic'

export default async function SuggestedMenteesPage() {
  let matches: Awaited<ReturnType<typeof getMenteeSuggestions>> = []
  let error: string | null = null

  try {
    matches = await getMenteeSuggestions()
  } catch (e) {
    error = (e as Error).message
  }

  return (
    <div className="min-h-full">
      <Navbar title="Suggested Mentees" subtitle="AI-matched students for you" />
      <div className="p-6">
        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 p-4 text-sm text-red-400 ring-1 ring-red-500/20">
            Could not load suggestions: {error}. Ensure your profile has skills/SDGs filled in.
          </div>
        )}

        {matches.length === 0 && !error ? (
          <div className="flex flex-col items-center py-16 text-center">
            <p className="text-3xl">🔍</p>
            <p className="mt-2 font-medium text-slate-300">No suggestions yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Complete your mentor profile with skills and SDG interests to get AI-matched students.
            </p>
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
