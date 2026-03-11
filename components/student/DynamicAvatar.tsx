'use client'

type AvatarState = 'idle' | 'excited' | 'running' | 'celebrating' | 'sad'

interface DynamicAvatarProps {
  state: AvatarState
  innovationScore: number
  streakDays: number
}

const STATE_CONFIG: Record<
  AvatarState,
  { emoji: string; gradient: string; ring: string; label: string }
> = {
  idle: { emoji: '✨', gradient: 'from-slate-600 to-slate-700', ring: 'ring-slate-500/30', label: 'Idle' },
  excited: { emoji: '🎯', gradient: 'from-yellow-500 to-orange-500', ring: 'ring-orange-500/40', label: 'Excited' },
  running: { emoji: '🚀', gradient: 'from-green-500 to-emerald-600', ring: 'ring-green-500/40', label: 'Running' },
  celebrating: { emoji: '🏆', gradient: 'from-sky-500 to-blue-500', ring: 'ring-sky-500/40', label: 'Celebrating' },
  sad: { emoji: '😔', gradient: 'from-blue-600 to-blue-800', ring: 'ring-blue-500/30', label: 'Sad' },
}

function getAvatarState(score: number, streak: number): AvatarState {
  if (streak === 0 && score > 0) return 'sad'
  if (score >= 1000) return 'celebrating'
  if (score >= 500) return 'running'
  if (score >= 100) return 'excited'
  return 'idle'
}

export default function DynamicAvatar({ state, innovationScore, streakDays }: DynamicAvatarProps) {
  const computedState = state !== 'idle' ? state : getAvatarState(innovationScore, streakDays)
  const config = STATE_CONFIG[computedState]

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar circle */}
      <div
        className={`relative flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br ${config.gradient} p-[3px] shadow-2xl ring-4 ${config.ring} transition-all duration-500`}
      >
        <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-950/70">
          <span className="text-5xl" style={{ filter: 'drop-shadow(0 0 8px rgba(56,189,248,0.5))' }}>
            {config.emoji}
          </span>
        </div>

        {/* State badge */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-300 ring-1 ring-white/10 whitespace-nowrap">
          {config.label}
        </div>
      </div>

      {/* Score */}
      <div className="mt-2 text-center">
        <p className="text-2xl font-bold text-white">{innovationScore.toLocaleString()}</p>
        <p className="text-xs text-slate-400">Innovation Score</p>
      </div>

      {/* Streak */}
      <div className="flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1 ring-1 ring-orange-500/30">
        <span className="text-sm">🔥</span>
        <span className="text-sm font-medium text-orange-400">{streakDays} day streak</span>
      </div>
    </div>
  )
}
