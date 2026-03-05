interface StartupCardProps {
  startup: {
    id: string
    name: string
    description: string
    stage: string
    domain: string
    sdg_tags: string[]
    funding_raised: number
    similarity: number
    growth_insight: string | null
  }
}

const STAGE_COLORS: Record<string, string> = {
  idea: 'bg-slate-500/20 text-slate-300',
  mvp: 'bg-blue-500/20 text-blue-300',
  revenue: 'bg-yellow-500/20 text-yellow-300',
  funded: 'bg-green-500/20 text-green-300',
  scaling: 'bg-purple-500/20 text-purple-300',
}

export default function StartupCard({ startup }: StartupCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-5 transition hover:border-purple-500/30">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold text-white">{startup.name}</h4>
          {startup.domain && (
            <p className="mt-0.5 text-xs text-slate-400">{startup.domain}</p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
            STAGE_COLORS[startup.stage] ?? 'bg-slate-500/20 text-slate-300'
          }`}
        >
          {startup.stage}
        </span>
      </div>

      {/* Description */}
      {startup.description && (
        <p className="text-sm text-slate-400 line-clamp-2">{startup.description}</p>
      )}

      {/* SDG Tags */}
      {startup.sdg_tags?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {startup.sdg_tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-300 ring-1 ring-blue-500/20"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Match + Funding */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {Math.round(startup.similarity * 100)}% thesis match
        </span>
        {startup.funding_raised > 0 && (
          <span className="text-xs font-medium text-green-400">
            ${startup.funding_raised.toLocaleString()} raised
          </span>
        )}
      </div>

      {/* AI Growth Insight */}
      {startup.growth_insight && (
        <div className="rounded-lg bg-amber-500/5 p-3 ring-1 ring-amber-500/20">
          <p className="mb-1 text-xs font-semibold text-amber-400">AI Growth Insight</p>
          <p className="text-xs text-slate-300 leading-relaxed">{startup.growth_insight}</p>
        </div>
      )}
    </div>
  )
}
