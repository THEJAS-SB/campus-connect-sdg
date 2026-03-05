"use client";

import { useEffect, useRef } from "react";
import { DotLottieReact } from "@dotlottie/react-player";

type AvatarState = "idle" | "excited" | "running" | "celebrating" | "sad";

interface DynamicAvatarProps {
  state: AvatarState;
  innovationScore: number;
  streakDays: number;
}

// Lottie animation sources (public CDN – replace with your own .lottie files in /public)
const AVATAR_SOURCES: Record<AvatarState, string> = {
  idle: "https://lottie.host/4b6c3e0b-0c4b-4a62-8c1a-2b3c4d5e6f7a/idle.lottie",
  excited:
    "https://lottie.host/5c7d4f1a-1d5c-5b73-9d2b-3c4d5e6f7a8b/excited.lottie",
  running:
    "https://lottie.host/6d8e5g2b-2e6d-6c84-ae3c-4d5e6f7a8b9c/running.lottie",
  celebrating:
    "https://lottie.host/7e9f6h3c-3f7e-7d95-bf4d-5e6f7a8b9c0d/celebrating.lottie",
  sad: "https://lottie.host/8f0g7i4d-4g8f-8e06-cg5e-6f7a8b9c0d1e/sad.lottie",
};

const STATE_COLORS: Record<AvatarState, string> = {
  idle: "from-slate-600 to-slate-700",
  excited: "from-yellow-500 to-orange-500",
  running: "from-green-500 to-emerald-600",
  celebrating: "from-purple-500 to-pink-500",
  sad: "from-blue-600 to-blue-800",
};

function getAvatarState(score: number, streak: number): AvatarState {
  if (streak === 0 && score > 0) return "sad";
  if (score >= 1000) return "celebrating";
  if (score >= 500) return "running";
  if (score >= 100) return "excited";
  return "idle";
}

export default function DynamicAvatar({
  state,
  innovationScore,
  streakDays,
}: DynamicAvatarProps) {
  const computedState =
    state !== "idle" ? state : getAvatarState(innovationScore, streakDays);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar container */}
      <div
        className={`relative flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br ${STATE_COLORS[computedState]} p-1 shadow-lg ring-2 ring-white/10`}
      >
        <div className="h-full w-full overflow-hidden rounded-full bg-slate-900/50">
          <DotLottieReact
            src={AVATAR_SOURCES[computedState]}
            loop
            autoplay
            className="h-full w-full"
          />
        </div>

        {/* State badge */}
        <div className="absolute -bottom-1 -right-1 rounded-full bg-slate-800 px-2 py-0.5 text-xs capitalize ring-1 ring-white/10">
          {computedState}
        </div>
      </div>

      {/* Score display */}
      <div className="text-center">
        <div className="text-2xl font-bold text-white">
          {innovationScore.toLocaleString()}
        </div>
        <div className="text-xs text-slate-400">Innovation Score</div>
      </div>

      {/* Streak */}
      <div className="flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1 ring-1 ring-orange-500/30">
        <span className="text-sm">🔥</span>
        <span className="text-sm font-medium text-orange-400">
          {streakDays} day streak
        </span>
      </div>
    </div>
  );
}
