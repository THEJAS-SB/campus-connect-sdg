"use client";

import { useState } from "react";
import type { ScoredCompetition } from "@/app/actions/competitions";

const PLATFORM_STYLES: Record<string, string> = {
  Devpost: "bg-blue-500/20 text-blue-400 ring-blue-500/30",
  Unstop: "bg-orange-500/20 text-orange-400 ring-orange-500/30",
  MLH: "bg-red-500/20 text-red-400 ring-red-500/30",
  Kaggle: "bg-cyan-500/20 text-cyan-400 ring-cyan-500/30",
  LeetCode: "bg-amber-500/20 text-amber-400 ring-amber-500/30",
  Codeforces: "bg-rose-500/20 text-rose-400 ring-rose-500/30",
  CodeChef: "bg-yellow-500/20 text-yellow-300 ring-yellow-500/30",
  HackerRank: "bg-green-500/20 text-green-400 ring-green-500/30",
  HackerEarth: "bg-indigo-500/20 text-indigo-400 ring-indigo-500/30",
  AtCoder: "bg-sky-500/20 text-sky-400 ring-sky-500/30",
  TopCoder: "bg-slate-500/20 text-slate-300 ring-slate-500/30",
};

const DIFFICULTY_STYLES: Record<string, string> = {
  Beginner: "text-emerald-400",
  Intermediate: "text-amber-400",
  Advanced: "text-rose-400",
};

interface RecommendedCompetitionsProps {
  competitions: ScoredCompetition[];
}

export default function RecommendedCompetitions({
  competitions,
}: RecommendedCompetitionsProps) {
  const [toast, setToast] = useState<string | null>(null);
  const [participating, setParticipating] = useState<Set<string>>(new Set());

  function handleParticipating(id: string) {
    setParticipating((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setToast("Added to your Activity Timeline! +50 XP 🎉");
    setTimeout(() => setToast(null), 3000);
  }

  if (competitions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/20 p-8 text-center">
        <p className="text-slate-400">
          No competitions found. Add skills to your profile to get personalised
          recommendations!
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Section header */}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-xl">🏆</span>
        <h3 className="text-base font-semibold text-white">
          Recommended Competitions
        </h3>
      </div>

      {/* Cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {competitions.map((c) => {
          const isJoined = participating.has(c.id);
          const daysLeft = Math.max(
            0,
            Math.ceil(
              (new Date(c.deadline).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24),
            ),
          );

          return (
            <div
              key={c.id}
              className="group relative flex flex-col rounded-xl border border-white/10 bg-white/5 p-5 transition-all duration-300 hover:border-purple-500/40 hover:shadow-[0_0_24px_-4px_rgba(168,85,247,0.25)]"
            >
              {/* Top row: platform badge + difficulty */}
              <div className="mb-3 flex items-center justify-between">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${PLATFORM_STYLES[c.platform] ?? "bg-white/10 text-slate-300 ring-white/20"}`}
                >
                  {c.platform}
                </span>
                <span
                  className={`text-[11px] font-medium ${DIFFICULTY_STYLES[c.difficulty] ?? "text-slate-400"}`}
                >
                  {c.difficulty}
                </span>
              </div>

              {/* Title */}
              <h4 className="mb-1 text-sm font-semibold leading-snug text-white">
                {c.title}
              </h4>

              {/* Description */}
              <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-slate-400">
                {c.description}
              </p>

              {/* Matched skill tags */}
              {c.matchedTags.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {c.matchedTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-purple-500/15 px-2 py-0.5 text-[10px] font-medium text-purple-300 ring-1 ring-purple-500/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Meta row: deadline + prize */}
              <div className="mb-4 mt-auto flex items-center gap-3 text-[11px] text-slate-500">
                <span>
                  ⏰ {daysLeft > 0 ? `${daysLeft}d left` : "Deadline passed"}
                </span>
                <span>•</span>
                <span> 🏅 {c.prize.replace(/<[^>]*>/g, "")} </span>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-lg bg-purple-600 py-2 text-center text-xs font-semibold text-white transition hover:bg-purple-500"
                >
                  Apply Now ↗
                </a>
                <button
                  disabled={isJoined}
                  onClick={() => handleParticipating(c.id)}
                  className={`flex-1 rounded-lg py-2 text-center text-xs font-semibold transition ${
                    isJoined
                      ? "cursor-default bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30"
                      : "bg-white/10 text-slate-300 ring-1 ring-white/10 hover:bg-white/20"
                  }`}
                >
                  {isJoined ? "✓ Joined" : "I'm Participating"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-[slideUp_0.3s_ease-out] rounded-lg border border-emerald-500/30 bg-emerald-600/90 px-5 py-3 text-sm font-medium text-white shadow-lg backdrop-blur-sm">
          {toast}
        </div>
      )}
    </div>
  );
}
