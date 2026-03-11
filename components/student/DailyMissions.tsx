"use client";

import { useTransition, useState } from "react";
import { completeMission } from "@/app/actions/student";

interface Mission {
  id: string;
  title: string;
  description: string;
  xp_reward: number;
  is_completed: boolean;
}

interface DailyMissionsProps {
  missions: Mission[];
}

export default function DailyMissions({ missions }: DailyMissionsProps) {
  const [isPending, startTransition] = useTransition();
  const [localCompleted, setLocalCompleted] = useState<Set<string>>(
    new Set(missions.filter((m) => m.is_completed).map((m) => m.id)),
  );

  function handleComplete(mission: Mission) {
    if (localCompleted.has(mission.id)) return;
    setLocalCompleted((prev) => new Set(prev).add(mission.id));
    startTransition(() => {
      completeMission(mission.id, mission.xp_reward);
    });
  }

  const totalXp = missions.reduce(
    (sum, m) => (localCompleted.has(m.id) ? sum + m.xp_reward : sum),
    0,
  );
  const maxXp = missions.reduce((sum, m) => sum + m.xp_reward, 0);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white">Daily Missions</h3>
          <p className="text-xs text-slate-400">AI-generated for you today</p>
        </div>
        <div className="rounded-full bg-yellow-500/10 px-3 py-1 ring-1 ring-yellow-500/30">
          <span className="text-sm font-medium text-yellow-400">
            {totalXp}/{maxXp} XP
          </span>
        </div>
      </div>

      {/* XP Progress bar */}
      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-yellow-500 transition-all duration-500"
          style={{ width: maxXp > 0 ? `${(totalXp / maxXp) * 100}%` : "0%" }}
        />
      </div>

      <ul className="space-y-3">
        {missions.map((mission) => {
          const done = localCompleted.has(mission.id);
          return (
            <li
              key={mission.id}
              className={`flex items-start gap-3 rounded-lg p-3 transition-all ${
                done
                  ? "bg-green-500/5 ring-1 ring-green-500/20"
                  : "bg-white/3 ring-1 ring-white/5"
              }`}
            >
              <button
                onClick={() => handleComplete(mission)}
                disabled={done || isPending}
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                  done
                    ? "border-green-500 bg-green-600 text-white"
                    : "border-slate-500 hover:border-sky-400"
                }`}
              >
                {done && (
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${done ? "line-through text-slate-500" : "text-white"}`}
                >
                  {mission.title}
                </p>
                <p className="mt-0.5 text-xs text-slate-400 leading-relaxed">
                  {mission.description}
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-400">
                +{mission.xp_reward} XP
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
