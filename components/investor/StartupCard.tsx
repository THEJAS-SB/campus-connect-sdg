"use client";

import { useState } from "react";
import {
  addToPipeline,
  getStartupGrowthInsight,
  type PipelineStage,
} from "@/app/actions/investor";

interface StartupCardProps {
  startup: {
    id: string;
    name: string;
    pitch?: string | null;
    stage?: string | null;
    domain?: string | null;
    sdgs?: string[] | null;
    funding_raised?: number | null;
    pitch_deck_url?: string | null;
    demo_url?: string | null;
    github_url?: string | null;
    profiles?: {
      full_name: string;
      rs_id: string;
      innovation_score?: number | null;
      linkedin_url?: string | null;
    } | null;
  };
}

const STAGE_COLORS: Record<string, string> = {
  idea: "bg-slate-500/20 text-slate-300",
  mvp: "bg-blue-500/20 text-blue-300",
  revenue: "bg-yellow-500/20 text-yellow-300",
  funded: "bg-green-500/20 text-green-300",
  scaling: "bg-purple-500/20 text-purple-300",
};

export default function StartupCard({ startup }: StartupCardProps) {
  const [showGrowth, setShowGrowth] = useState(false);
  const [growthInsight, setGrowthInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [adding, setAdding] = useState(false);

  async function handleAddToPipeline(stage: PipelineStage) {
    setAdding(true);
    try {
      await addToPipeline(startup.id, stage);
      alert(`Added ${startup.name} to ${stage} stage!`);
    } catch (error) {
      console.error("Failed to add to pipeline:", error);
      alert("Failed to add to pipeline");
    } finally {
      setAdding(false);
    }
  }

  async function loadGrowthInsight() {
    if (growthInsight) {
      setShowGrowth(!showGrowth);
      return;
    }
    setLoadingInsight(true);
    try {
      const insight = await getStartupGrowthInsight(startup.id);
      setGrowthInsight(insight);
      setShowGrowth(true);
    } catch (error) {
      console.error("Failed to load growth insight:", error);
      alert("Failed to load AI insight");
    } finally {
      setLoadingInsight(false);
    }
  }

  const founder = startup.profiles;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-5 transition hover:border-purple-500/30">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h4 className="font-semibold text-white">{startup.name}</h4>
          {startup.domain && (
            <p className="mt-0.5 text-xs text-slate-400">{startup.domain}</p>
          )}
          {founder && (
            <p className="mt-1 text-xs text-slate-500">
              by {founder.full_name}
            </p>
          )}
        </div>
        {startup.stage && (
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
              STAGE_COLORS[startup.stage] ?? "bg-slate-500/20 text-slate-300"
            }`}
          >
            {startup.stage}
          </span>
        )}
      </div>

      {/* Pitch */}
      {startup.pitch && (
        <p className="text-sm text-slate-400 line-clamp-3">{startup.pitch}</p>
      )}

      {/* SDG Tags */}
      {startup.sdgs && startup.sdgs.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {startup.sdgs.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-300 ring-1 ring-blue-500/20"
            >
              {tag}
            </span>
          ))}
          {startup.sdgs.length > 3 && (
            <span className="rounded-full bg-slate-500/10 px-2 py-0.5 text-xs text-slate-400">
              +{startup.sdgs.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Funding Raised */}
      {(startup.funding_raised ?? 0) > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Raised:</span>
          <span className="text-sm font-medium text-green-400">
            ${(startup.funding_raised ?? 0).toLocaleString()}
          </span>
        </div>
      )}

      {/* Innovation Score */}
      {founder?.innovation_score && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Innovation Score:</span>
          <span className="text-sm font-semibold text-purple-400">
            {founder.innovation_score}
          </span>
        </div>
      )}

      {/* AI Growth Insight */}
      {showGrowth && growthInsight && (
        <div className="rounded-lg bg-amber-500/5 p-3 ring-1 ring-amber-500/20">
          <p className="mb-1 text-xs font-semibold text-amber-400">
            🤖 AI Growth Analysis
          </p>
          <p className="text-xs text-slate-300 leading-relaxed">
            {growthInsight}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 border-t border-white/5 pt-3">
        {/* Links */}
        <div className="flex gap-2">
          {startup.pitch_deck_url && (
            <a
              href={startup.pitch_deck_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-lg bg-blue-600/10 py-2 text-center text-xs font-medium text-blue-300 transition hover:bg-blue-600/20"
            >
              📊 Pitch Deck
            </a>
          )}
          {startup.demo_url && (
            <a
              href={startup.demo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-lg bg-purple-600/10 py-2 text-center text-xs font-medium text-purple-300 transition hover:bg-purple-600/20"
            >
              🚀 Demo
            </a>
          )}
          {startup.github_url && (
            <a
              href={startup.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-lg bg-slate-600/10 py-2 text-center text-xs font-medium text-slate-300 transition hover:bg-slate-600/20"
            >
              💻 GitHub
            </a>
          )}
        </div>

        {/* AI Insight Button */}
        <button
          onClick={loadGrowthInsight}
          disabled={loadingInsight}
          className="w-full rounded-lg bg-amber-600/10 py-2 text-xs font-medium text-amber-300 transition hover:bg-amber-600/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loadingInsight
            ? "⏳ Loading..."
            : showGrowth
              ? "🤖 Hide Insight"
              : "🤖 AI Growth Insight"}
        </button>

        {/* Add to Pipeline Dropdown */}
        <details className="relative">
          <summary className="w-full cursor-pointer rounded-lg bg-purple-600 py-2 text-center text-xs font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50">
            {adding ? "⏳ Adding..." : "+ Add to Pipeline"}
          </summary>
          <div className="absolute bottom-full left-0 right-0 mb-1 space-y-1 rounded-lg border border-white/10 bg-slate-900 p-2 shadow-xl">
            <button
              onClick={() => handleAddToPipeline("bookmarked")}
              disabled={adding}
              className="w-full rounded bg-slate-800 px-3 py-2 text-left text-xs text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              🔖 Bookmarked
            </button>
            <button
              onClick={() => handleAddToPipeline("in_talks")}
              disabled={adding}
              className="w-full rounded bg-slate-800 px-3 py-2 text-left text-xs text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              💬 In Talks
            </button>
            <button
              onClick={() => handleAddToPipeline("due_diligence")}
              disabled={adding}
              className="w-full rounded bg-slate-800 px-3 py-2 text-left text-xs text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              🔍 Due Diligence
            </button>
          </div>
        </details>
      </div>
    </div>
  );
}
