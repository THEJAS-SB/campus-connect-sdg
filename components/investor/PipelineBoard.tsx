"use client";

import { useState } from "react";
import {
  updatePipelineStage,
  type PipelineStage,
} from "@/app/actions/investor";
import StartupPipelineCard from "./StartupPipelineCard";

interface PipelineEntry {
  id: string;
  startup_id: string;
  stage: string;
  notes?: string | null;
  investment_amount?: number | null;
  startups: {
    id: string;
    name: string;
    pitch?: string | null;
    stage?: string | null;
    domain?: string | null;
    sdgs?: string[] | null;
    funding_raised?: number | null;
    pitch_deck_url?: string | null;
    profiles: {
      full_name: string;
      rs_id: string;
    } | null;
  } | null;
}

interface PipelineBoardProps {
  initialPipeline: PipelineEntry[];
}

const COLUMNS: {
  key: PipelineStage;
  label: string;
  icon: string;
  color: string;
}[] = [
  {
    key: "bookmarked",
    label: "Bookmarked",
    icon: "🔖",
    color: "border-slate-500/30 bg-slate-500/5",
  },
  {
    key: "in_talks",
    label: "In Talks",
    icon: "💬",
    color: "border-blue-500/30 bg-blue-500/5",
  },
  {
    key: "due_diligence",
    label: "Due Diligence",
    icon: "🔍",
    color: "border-yellow-500/30 bg-yellow-500/5",
  },
  {
    key: "invested",
    label: "Invested",
    icon: "✅",
    color: "border-green-500/30 bg-green-500/5",
  },
];

export default function PipelineBoard({ initialPipeline }: PipelineBoardProps) {
  const [pipeline, setPipeline] = useState(initialPipeline);
  const [moving, setMoving] = useState<string | null>(null);

  async function moveToStage(entryId: string, newStage: PipelineStage) {
    setMoving(entryId);
    setPipeline((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, stage: newStage } : e)),
    );
    try {
      await updatePipelineStage(entryId, newStage);
    } catch (error) {
      console.error("Failed to update stage:", error);
      // Revert on error
      setPipeline(initialPipeline);
    } finally {
      setMoving(null);
    }
  }

  if (pipeline.length === 0) {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center rounded-xl border-2 border-dashed border-white/20">
        <div className="text-center">
          <p className="text-3xl">📊</p>
          <p className="mt-2 font-medium text-slate-300">
            Your pipeline is empty
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Discover startups and add them to your pipeline to get started.
          </p>
          <a
            href="/investor/discover"
            className="mt-4 inline-block rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
          >
            Discover Startups
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {COLUMNS.map((col) => {
        const items = pipeline.filter((e) => e.stage === col.key);
        return (
          <div
            key={col.key}
            className={`min-h-[500px] rounded-xl border p-4 ${col.color}`}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span>{col.icon}</span>
                <h3 className="text-sm font-semibold text-white">
                  {col.label}
                </h3>
              </div>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-400">
                {items.length}
              </span>
            </div>

            <div className="space-y-3">
              {items.map((entry) => {
                const startup = entry.startups;
                if (!startup) return null;
                return (
                  <StartupPipelineCard
                    key={entry.id}
                    entry={entry}
                    currentStage={col.key}
                    onMove={moveToStage}
                    isMoving={moving === entry.id}
                    allStages={COLUMNS}
                  />
                );
              })}

              {items.length === 0 && (
                <p className="pt-8 text-center text-xs text-slate-600">
                  Drop startups here
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
