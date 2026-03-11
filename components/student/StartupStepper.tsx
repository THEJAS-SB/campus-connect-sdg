'use client'

import { useTransition } from 'react'
import { updateStartupStage, type StartupStage } from '@/app/actions/student'

const STAGES: { key: StartupStage; label: string; icon: string; description: string }[] = [
  { key: 'idea', label: 'Idea', icon: '💡', description: 'You have the concept' },
  { key: 'mvp', label: 'MVP', icon: '🔧', description: 'You have a working prototype' },
  { key: 'revenue', label: 'Revenue', icon: '💰', description: 'Paying customers' },
  { key: 'funded', label: 'Funded', icon: '🏦', description: 'Raised external capital' },
  { key: 'scaling', label: 'Scaling', icon: '🚀', description: 'Growing fast' },
]

const STAGE_ORDER: StartupStage[] = ['idea', 'mvp', 'revenue', 'funded', 'scaling']

interface StartupStepperProps {
  startupId: string
  currentStage: StartupStage
  startupName: string
}

export default function StartupStepper({ startupId, currentStage, startupName }: StartupStepperProps) {
  const [isPending, startTransition] = useTransition()
  const currentIndex = STAGE_ORDER.indexOf(currentStage)

  function handleStageUpdate(stage: StartupStage) {
    const newIndex = STAGE_ORDER.indexOf(stage)
    if (newIndex <= currentIndex) return // can't go backwards
    startTransition(() => {
      updateStartupStage(startupId, stage)
    })
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white">{startupName}</h3>
          <p className="text-xs text-slate-400">Startup Journey</p>
        </div>
        {isPending && (
          <span className="text-xs text-sky-400 animate-pulse">Updating…</span>
        )}
      </div>

      <div className="relative flex items-start justify-between">
        {/* Connector line */}
        <div className="absolute left-0 right-0 top-5 h-0.5 bg-white/10" />
        <div
          className="absolute left-0 top-5 h-0.5 bg-sky-500 transition-all duration-500"
          style={{ width: `${(currentIndex / (STAGE_ORDER.length - 1)) * 100}%` }}
        />

        {STAGES.map((stage, index) => {
          const isDone = index < currentIndex
          const isCurrent = index === currentIndex
          const isNext = index === currentIndex + 1
          const isFuture = index > currentIndex

          return (
            <button
              key={stage.key}
              onClick={() => handleStageUpdate(stage.key)}
              disabled={!isNext || isPending}
              className={`relative z-10 flex flex-col items-center gap-1.5 ${
                isNext ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm transition-all ${
                  isDone
                    ? 'border-sky-500 bg-sky-600'
                    : isCurrent
                    ? 'border-sky-400 bg-sky-500 ring-4 ring-sky-500/30'
                    : isNext
                    ? 'border-slate-500 bg-slate-800 hover:border-sky-400'
                    : 'border-slate-700 bg-slate-900 opacity-50'
                }`}
              >
                {stage.icon}
              </div>
              <span
                className={`text-xs font-medium ${
                  isCurrent
                    ? 'text-sky-300'
                    : isDone
                    ? 'text-slate-300'
                    : 'text-slate-500'
                }`}
              >
                {stage.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Current stage details */}
      <div className="mt-5 rounded-lg bg-sky-500/10 px-4 py-3 ring-1 ring-sky-500/20">
        <p className="text-sm font-medium text-sky-300">
          Current stage: {STAGES[currentIndex].label}
        </p>
        <p className="mt-0.5 text-xs text-slate-400">
          {STAGES[currentIndex].description}
        </p>
        {currentIndex < STAGE_ORDER.length - 1 && (
          <p className="mt-1 text-xs text-slate-500">
            Next: click <strong className="text-slate-400">{STAGES[currentIndex + 1].label}</strong> when ready
          </p>
        )}
      </div>
    </div>
  )
}
