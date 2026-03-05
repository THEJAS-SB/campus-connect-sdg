"use client";

import { useState, useTransition } from "react";
import { updateMentorshipStatus } from "@/app/actions/mentor";

interface MenteeConnectionCardProps {
  connection: {
    id: string;
    student_id: string;
    startup_id?: string | null;
    compatibility_score?: number | null;
    reasoning?: string | null;
    status: string;
    created_at: string;
    profiles: {
      id: string;
      rs_id: string;
      full_name: string;
      bio?: string | null;
      skills?: string[] | null;
      sdgs?: string[] | null;
      innovation_score?: number | null;
      linkedin_url?: string | null;
    } | null;
    startups?: {
      id: string;
      name: string;
      stage?: string | null;
      domain?: string | null;
    } | null;
  };
}

export default function MenteeConnectionCard({
  connection,
}: MenteeConnectionCardProps) {
  const [isPending, startTransition] = useTransition();
  const [localStatus, setLocalStatus] = useState(connection.status);

  const mentee = connection.profiles;
  const startup = connection.startups;

  if (!mentee) return null;

  const handleStatusChange = (
    newStatus: "active" | "completed" | "cancelled",
  ) => {
    startTransition(async () => {
      try {
        await updateMentorshipStatus(connection.id, newStatus);
        setLocalStatus(newStatus);
      } catch (error) {
        console.error("Failed to update status:", error);
        alert("Failed to update status. Please try again.");
      }
    });
  };

  const statusConfig = {
    pending: {
      color: "text-yellow-400 bg-yellow-500/10 ring-yellow-500/30",
      label: "Pending",
    },
    active: {
      color: "text-green-400 bg-green-500/10 ring-green-500/30",
      label: "Active",
    },
    completed: {
      color: "text-blue-400 bg-blue-500/10 ring-blue-500/30",
      label: "Completed",
    },
    cancelled: {
      color: "text-red-400 bg-red-500/10 ring-red-500/30",
      label: "Cancelled",
    },
  };

  const currentConfig =
    statusConfig[localStatus as keyof typeof statusConfig] ||
    statusConfig.pending;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/5 p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-white">{mentee.full_name}</h3>
          <p className="font-mono text-xs text-slate-400">{mentee.rs_id}</p>
          {startup && (
            <p className="mt-1 text-xs text-slate-400">
              Startup: <span className="text-purple-400">{startup.name}</span>
              {startup.stage && ` (${startup.stage})`}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${currentConfig.color}`}
        >
          {currentConfig.label}
        </span>
      </div>

      {/* Bio */}
      {mentee.bio && (
        <p className="line-clamp-2 text-sm text-slate-400">{mentee.bio}</p>
      )}

      {/* Stats */}
      <div className="flex gap-3 text-xs">
        {connection.compatibility_score && (
          <div className="rounded-lg bg-purple-500/10 px-3 py-1.5 ring-1 ring-purple-500/30">
            <span className="text-purple-400">
              {Math.round(connection.compatibility_score)}% match
            </span>
          </div>
        )}
        {mentee.innovation_score && (
          <div className="rounded-lg bg-blue-500/10 px-3 py-1.5 ring-1 ring-blue-500/30">
            <span className="text-blue-400">
              {mentee.innovation_score.toLocaleString()} IS
            </span>
          </div>
        )}
        {startup?.domain && (
          <div className="rounded-lg bg-green-500/10 px-3 py-1.5 ring-1 ring-green-500/30">
            <span className="text-green-400">{startup.domain}</span>
          </div>
        )}
      </div>

      {/* Skills */}
      {mentee.skills && mentee.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {mentee.skills.slice(0, 5).map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-300 ring-1 ring-white/10"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* AI Reasoning */}
      {connection.reasoning && (
        <div className="rounded-lg bg-purple-500/5 p-3 ring-1 ring-purple-500/20">
          <p className="mb-1 text-xs font-semibold text-purple-400">
            Why this match?
          </p>
          <p className="text-xs leading-relaxed text-slate-300">
            {connection.reasoning}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {localStatus === "pending" && (
          <>
            <button
              onClick={() => handleStatusChange("active")}
              disabled={isPending}
              className="flex-1 rounded-lg bg-green-600/20 px-3 py-2 text-xs font-medium text-green-400 ring-1 ring-green-600/30 transition hover:bg-green-600/30 disabled:opacity-50"
            >
              ✓ Accept
            </button>
            <button
              onClick={() => handleStatusChange("cancelled")}
              disabled={isPending}
              className="flex-1 rounded-lg bg-red-600/20 px-3 py-2 text-xs font-medium text-red-400 ring-1 ring-red-600/30 transition hover:bg-red-600/30 disabled:opacity-50"
            >
              ✗ Decline
            </button>
          </>
        )}

        {localStatus === "active" && (
          <>
            <a
              href={`https://wa.me/?text=Hi ${encodeURIComponent(mentee.full_name)}, let's schedule our next session!`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-600/10 px-3 py-2 text-xs font-medium text-green-400 ring-1 ring-green-600/30 transition hover:bg-green-600/20"
            >
              💬 WhatsApp
            </a>
            {mentee.linkedin_url && (
              <a
                href={mentee.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#0A66C2]/10 px-3 py-2 text-xs font-medium text-[#70aae0] ring-1 ring-[#0A66C2]/30 transition hover:bg-[#0A66C2]/20"
              >
                🔗 LinkedIn
              </a>
            )}
            <button
              onClick={() => handleStatusChange("completed")}
              disabled={isPending}
              className="rounded-lg bg-blue-600/20 px-3 py-2 text-xs font-medium text-blue-400 ring-1 ring-blue-600/30 transition hover:bg-blue-600/30 disabled:opacity-50"
            >
              Mark Complete
            </button>
          </>
        )}
      </div>
    </div>
  );
}
