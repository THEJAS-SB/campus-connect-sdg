'use client'

import { useState } from 'react'
import { updatePipelineStage } from '@/app/actions/recommendations'

type PipelineStage = 'bookmarked' | 'in_talks' | 'due_diligence' | 'invested'

interface PipelineEntry {
  id: string
  startup_id: string
  pipeline_stage: PipelineStage
  startups: {
    id: string
    name: string
    description: string
    stage: string
    domain: string
    sdg_tags: string[]
    funding_raised: number
  } | null
}

interface PipelineBoardProps {
  initialPipeline: PipelineEntry[]
}

const COLUMNS: { key: PipelineStage; label: string; icon: string; color: string }[] = [
  { key: 'bookmarked', label: 'Bookmarked', icon: '🔖', color: 'border-slate-500/30 bg-slate-500/5' },
  { key: 'in_talks', label: 'In Talks', icon: '💬', color: 'border-blue-500/30 bg-blue-500/5' },
  { key: 'due_diligence', label: 'Due Diligence', icon: '🔍', color: 'border-yellow-500/30 bg-yellow-500/5' },
  { key: 'invested', label: 'Invested', icon: '✅', color: 'border-green-500/30 bg-green-500/5' },
]

export default function PipelineBoard({ initialPipeline }: PipelineBoardProps) {
  const [pipeline, setPipeline] = useState(initialPipeline)
  const [moving, setMoving] = useState<string | null>(null)

  async function moveToStage(entryId: string, startupId: string, newStage: PipelineStage) {
    setMoving(entryId)
    setPipeline((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, pipeline_stage: newStage } : e))
    )
    try {
      await updatePipelineStage(startupId, newStage)
    } catch {
      // Revert on error
      setPipeline(initialPipeline)
    } finally {
      setMoving(null)
    }
  }

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {COLUMNS.map((col) => {
        const items = pipeline.filter((e) => e.pipeline_stage === col.key)
        return (
          <div key={col.key} className={`rounded-xl border p-4 ${col.color}`}>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span>{col.icon}</span>
                <h3 className="text-sm font-semibold text-white">{col.label}</h3>
              </div>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-400">
                {items.length}
              </span>
            </div>

            <div className="space-y-3 min-h-[80px]">
              {items.map((entry) => {
                const startup = entry.startups
                if (!startup) return null
                return (
                  <div
                    key={entry.id}
                    className={`rounded-lg border border-white/10 bg-slate-900/60 p-3 transition ${
                      moving === entry.id ? 'opacity-50' : ''
                    }`}
                  >
                    <p className="text-sm font-semibold text-white">{startup.name}</p>
                    {startup.domain && (
                      <p className="mt-0.5 text-xs text-slate-400">{startup.domain}</p>
                    )}
                    <p className="mt-1 text-xs capitalize text-purple-400">{startup.stage}</p>

                    {/* Move buttons */}
                    <div className="mt-2 flex gap-1 flex-wrap">
                      {COLUMNS.filter((c) => c.key !== col.key).map((target) => (
                        <button
                          key={target.key}
                          onClick={() => moveToStage(entry.id, startup.id, target.key)}
                          disabled={moving === entry.id}
                          className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-slate-400 transition hover:bg-white/10"
                        >
                          {target.icon}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}

              {items.length === 0 && (
                <p className="text-center text-xs text-slate-600 pt-4">Empty</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
