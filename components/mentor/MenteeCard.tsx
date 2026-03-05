interface MenteeCardProps {
  mentee: {
    id: string
    rs_id: string
    full_name: string
    skills: string[]
    sdg_interests: string[]
    bio: string
    linkedin_url: string
  }
  compatibilityScore: number
  reasoning: string
  onConnect?: (menteeId: string) => void
}

export default function MenteeCard({ mentee, compatibilityScore, reasoning }: MenteeCardProps) {
  const scoreColor =
    compatibilityScore >= 0.8
      ? 'text-green-400 bg-green-500/10 ring-green-500/30'
      : compatibilityScore >= 0.6
      ? 'text-yellow-400 bg-yellow-500/10 ring-yellow-500/30'
      : 'text-blue-400 bg-blue-500/10 ring-blue-500/30'

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-5 transition hover:border-purple-500/30">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold text-white">{mentee.full_name}</h4>
          <p className="text-xs font-mono text-slate-400">{mentee.rs_id}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${scoreColor}`}>
          {Math.round(compatibilityScore * 100)}% match
        </span>
      </div>

      {/* Bio */}
      {mentee.bio && (
        <p className="text-sm text-slate-400 line-clamp-2">{mentee.bio}</p>
      )}

      {/* Skills */}
      {mentee.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {mentee.skills.slice(0, 4).map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-300 ring-1 ring-white/10"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* AI Reasoning */}
      <div className="rounded-lg bg-purple-500/5 p-3 ring-1 ring-purple-500/20">
        <p className="mb-1 text-xs font-semibold text-purple-400">Why this match?</p>
        <p className="text-xs text-slate-300 leading-relaxed">{reasoning}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <a
          href={`https://wa.me/?text=Hi ${encodeURIComponent(mentee.full_name)}, I found your profile on INNOVEX and would love to connect!`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-600/10 px-3 py-2 text-xs font-medium text-green-400 ring-1 ring-green-600/30 transition hover:bg-green-600/20"
        >
          <span>💬</span> WhatsApp
        </a>
        {mentee.linkedin_url && (
          <a
            href={mentee.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#0A66C2]/10 px-3 py-2 text-xs font-medium text-[#70aae0] ring-1 ring-[#0A66C2]/30 transition hover:bg-[#0A66C2]/20"
          >
            <span>🔗</span> LinkedIn
          </a>
        )}
      </div>
    </div>
  )
}
