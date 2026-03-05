'use client'

import { useState, useEffect } from 'react'
import type { Badge, UserBadge } from '@/lib/gamification/badges'
import ShareButton from './ShareButton'

interface BadgeShowcaseProps {
  userBadges: UserBadge[]
  allBadges: Badge[]
  progress: { badge: Badge; progress: number; target: number; earned: boolean }[]
}

const BADGE_ICONS: Record<string, string> = {
  'First Step': '👋',
  'Idea Machine': '💡',
  'MVP Maker': '🛠️',
  'Revenue Ready': '💰',
  'Funded!': '🚀',
  'Mission Master': '🎯',
  'Streak Keeper': '🔥',
  'Networking Pro': '🤝',
  'Innovation Leader': '👑',
}

export default function BadgeShowcase({
  userBadges,
  allBadges,
  progress,
}: BadgeShowcaseProps) {
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null)

  return (
    <div className="space-y-6">
      {/* Earned Badges */}
      <div>
        <h3 className="mb-3 text-lg font-semibold text-white">
          🏆 Badges Earned ({userBadges.length}/{allBadges.length})
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {allBadges.map((badge) => {
            const userBadge = userBadges.find((ub) => ub.badge_id === badge.id)
            const badgeProgress = progress.find((p) => p.badge.id === badge.id)
            const isEarned = !!userBadge
            const icon = BADGE_ICONS[badge.name] ?? '🏅'

            return (
              <button
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                className={`group relative overflow-hidden rounded-xl border p-5 text-center transition ${
                  isEarned
                    ? 'border-amber-500/30 bg-amber-500/10 hover:border-amber-500/50'
                    : 'border-white/10 bg-white/5 opacity-60 hover:opacity-80'
                }`}
              >
                {/* Badge Icon */}
                <div
                  className={`mx-auto text-5xl transition group-hover:scale-110 ${
                    isEarned ? '' : 'grayscale'
                  }`}
                >
                  {icon}
                </div>

                {/* Badge Name */}
                <p
                  className={`mt-3 text-sm font-semibold ${
                    isEarned ? 'text-amber-300' : 'text-slate-500'
                  }`}
                >
                  {badge.name}
                </p>

                {/* Earned Date */}
                {isEarned && userBadge && (
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(userBadge.earned_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                )}

                {/* Progress Bar (if not earned) */}
                {!isEarned && badgeProgress && (
                  <div className="mt-2">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                        style={{
                          width: `${Math.min(
                            (badgeProgress.progress / badgeProgress.target) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {badgeProgress.progress}/{badgeProgress.target}
                    </p>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Badge Details Modal */}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="relative w-full max-w-md rounded-xl border border-white/20 bg-slate-900 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>

            <div className="text-center">
              <p className="text-6xl">{BADGE_ICONS[selectedBadge.name] ?? '🏅'}</p>
              <h3 className="mt-4 text-xl font-bold text-white">{selectedBadge.name}</h3>
              <p className="mt-2 text-sm text-slate-400">{selectedBadge.description}</p>

              {/* Criteria */}
              <div className="mt-4 rounded-lg bg-white/5 p-3">
                <p className="text-xs font-semibold text-slate-300">How to Earn</p>
                <p className="mt-1 text-xs text-slate-400">
                  {formatCriteria(selectedBadge.criteria)}
                </p>
              </div>

              {/* Progress */}
              {(() => {
                const badgeProgress = progress.find(
                  (p) => p.badge.id === selectedBadge.id
                )
                if (badgeProgress && !badgeProgress.earned) {
                  const percentage =
                    (badgeProgress.progress / badgeProgress.target) * 100
                  return (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Progress</span>
                        <span>
                          {badgeProgress.progress}/{badgeProgress.target}
                        </span>
                      </div>
                      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  )
                } else if (badgeProgress?.earned) {
                  return (
                    <div className="mt-4 space-y-3">
                      <div className="rounded-lg bg-green-500/10 p-3 ring-1 ring-green-500/30">
                        <p className="text-sm font-semibold text-green-400">✅ Earned!</p>
                      </div>
                      <div className="flex justify-center">
                        <ShareButton
                          title={`🏆 I earned the "${selectedBadge.name}" badge!`}
                          text={`Just unlocked a new achievement on INNOVEX: ${selectedBadge.description}`}
                        />
                      </div>
                    </div>
                  )
                }
                return null
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function formatCriteria(criteria: {
  type: string
  count?: number
  stage?: string
  threshold?: number
}): string {
  const { type, count, stage, threshold } = criteria

  switch (type) {
    case 'profile_complete':
      return 'Complete your profile with name, bio, skills, and SDGs'
    case 'startup_created':
      return `Create ${count === 1 ? 'your first startup' : `${count} startups`}`
    case 'startup_stage':
      return `Progress your startup to ${stage} stage`
    case 'missions_completed':
      return `Complete ${count} daily missions`
    case 'streak_days':
      return `Maintain a ${count}-day login streak`
    case 'mentor_connections':
      return `Connect with ${count} mentors`
    case 'innovation_score':
      return `Reach ${threshold} innovation score`
    default:
      return 'Complete the required criteria'
  }
}
