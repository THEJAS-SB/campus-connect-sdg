"use client";

import { useState } from "react";
import type { PipelineStage } from "@/app/actions/investor";
import {
  removeFromPipeline,
  updateInvestmentDetails,
} from "@/app/actions/investor";

type StartupPipelineCardProps = {
  entry: {
    id: string;
    stage: PipelineStage;
    notes?: string | null;
    investment_amount?: number | null;
    valuation?: number | null;
    equity_percentage?: number | null;
    startups: {
      id: string;
      name: string;
      domain?: string | null;
      stage?: string | null;
      pitch?: string | null;
      funding_goal?: number | null;
      profiles?: {
        name: string;
        avatar_url?: string | null;
      } | null;
    } | null;
  };
  currentStage: PipelineStage;
  onMove: (entryId: string, newStage: PipelineStage) => Promise<void>;
  isMoving: boolean;
  allStages: {
    key: PipelineStage;
    label: string;
    icon: string;
    color: string;
  }[];
};

export default function StartupPipelineCard({
  entry,
  currentStage,
  onMove,
  isMoving,
  allStages,
}: StartupPipelineCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState(false);
  const [removing, setRemoving] = useState(false);

  const startup = entry.startups;
  if (!startup) return null;

  const founder = startup.profiles;

  async function handleRemove() {
    if (!startup || !confirm(`Remove ${startup.name} from your pipeline?`))
      return;
    setRemoving(true);
    try {
      await removeFromPipeline(entry.id);
    } catch (error) {
      console.error("Failed to remove:", error);
      alert("Failed to remove from pipeline");
    } finally {
      setRemoving(false);
    }
  }

  async function handleUpdateInvestment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const amount = formData.get("amount") as string;
    const valuation = formData.get("valuation") as string;
    const equity = formData.get("equity") as string;
    const notes = formData.get("notes") as string;

    try {
      await updateInvestmentDetails(entry.id, {
        investmentAmount: amount ? parseFloat(amount) : undefined,
        valuation: valuation ? parseFloat(valuation) : undefined,
        equityPercentage: equity ? parseFloat(equity) : undefined,
        notes: notes || undefined,
      });
      setEditingInvestment(false);
    } catch (error) {
      console.error("Failed to update investment details:", error);
      alert("Failed to update investment details");
    }
  }

  return (
    <div
      className={`rounded-lg border border-white/10 bg-slate-900/60 p-3 transition ${
        isMoving || removing ? "opacity-50" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-white">{startup.name}</h4>
          {startup.domain && (
            <p className="mt-0.5 text-xs text-slate-400">{startup.domain}</p>
          )}
          {startup.stage && (
            <p className="mt-1 text-xs capitalize text-purple-400">
              {startup.stage}
            </p>
          )}
        </div>

        {/* Avatar */}
        {founder?.avatar_url && (
          <img
            src={founder.avatar_url}
            alt={founder.name}
            className="h-8 w-8 rounded-full border border-white/20 object-cover"
          />
        )}
      </div>

      {/* Pitch */}
      {startup.pitch && (
        <p className="mt-2 line-clamp-2 text-xs text-slate-300">
          {startup.pitch}
        </p>
      )}

      {/* Investment Details (if invested) */}
      {currentStage === "invested" && (
        <div className="mt-2 space-y-1 rounded border border-green-500/30 bg-green-500/5 p-2 text-xs">
          {entry.investment_amount && (
            <p className="text-green-400">
              💰 Invested: ${entry.investment_amount.toLocaleString()}
            </p>
          )}
          {entry.valuation && (
            <p className="text-slate-300">
              Valuation: ${entry.valuation.toLocaleString()}
            </p>
          )}
          {entry.equity_percentage && (
            <p className="text-slate-300">Equity: {entry.equity_percentage}%</p>
          )}
        </div>
      )}

      {/* Notes */}
      {entry.notes && (
        <p className="mt-2 text-xs italic text-slate-400">"{entry.notes}"</p>
      )}

      {/* Actions */}
      <div className="mt-3 flex items-center justify-between gap-2">
        {/* Move to Stage */}
        <div className="flex flex-wrap gap-1">
          {allStages
            .filter((s) => s.key !== currentStage)
            .map((target) => (
              <button
                key={target.key}
                onClick={() => onMove(entry.id, target.key)}
                disabled={isMoving || removing}
                className="rounded bg-white/5 px-2 py-1 text-xs text-slate-400 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                title={`Move to ${target.label}`}
              >
                {target.icon}
              </button>
            ))}
        </div>

        {/* More Options */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="rounded bg-white/5 px-2 py-1 text-xs text-slate-400 transition hover:bg-white/10"
          >
            {showDetails ? "▲" : "▼"}
          </button>
          <button
            onClick={handleRemove}
            disabled={removing}
            className="rounded bg-red-500/10 px-2 py-1 text-xs text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            title="Remove from pipeline"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
          {/* Founder Info */}
          {founder && (
            <div className="text-xs">
              <p className="font-semibold text-slate-300">{founder.name}</p>
            </div>
          )}

          {/* Funding Goal */}
          {startup.funding_goal && (
            <p className="text-xs text-slate-400">
              Target: ${startup.funding_goal.toLocaleString()}
            </p>
          )}

          {/* Investment Form (if in_talks or due_diligence) */}
          {(currentStage === "in_talks" ||
            currentStage === "due_diligence") && (
            <div className="mt-2">
              {!editingInvestment ? (
                <button
                  onClick={() => setEditingInvestment(true)}
                  className="w-full rounded bg-purple-600/20 px-2 py-1.5 text-xs text-purple-300 transition hover:bg-purple-600/30"
                >
                  + Add Investment Details
                </button>
              ) : (
                <form onSubmit={handleUpdateInvestment} className="space-y-2">
                  <input
                    type="number"
                    name="amount"
                    placeholder="Investment Amount"
                    defaultValue={entry.investment_amount ?? ""}
                    className="w-full rounded bg-slate-800 px-2 py-1 text-xs text-white placeholder:text-slate-500"
                  />
                  <input
                    type="number"
                    name="valuation"
                    placeholder="Valuation"
                    defaultValue={entry.valuation ?? ""}
                    className="w-full rounded bg-slate-800 px-2 py-1 text-xs text-white placeholder:text-slate-500"
                  />
                  <input
                    type="number"
                    name="equity"
                    placeholder="Equity %"
                    step="0.1"
                    defaultValue={entry.equity_percentage ?? ""}
                    className="w-full rounded bg-slate-800 px-2 py-1 text-xs text-white placeholder:text-slate-500"
                  />
                  <textarea
                    name="notes"
                    placeholder="Notes"
                    defaultValue={entry.notes ?? ""}
                    rows={2}
                    className="w-full rounded bg-slate-800 px-2 py-1 text-xs text-white placeholder:text-slate-500"
                  />
                  <div className="flex gap-1">
                    <button
                      type="submit"
                      className="flex-1 rounded bg-green-600 px-2 py-1 text-xs text-white transition hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingInvestment(false)}
                      className="rounded bg-slate-700 px-2 py-1 text-xs text-slate-300 transition hover:bg-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* View Full Profile Link */}
          <a
            href={`/investor/startup/${startup.id}`}
            className="block rounded bg-white/5 px-2 py-1.5 text-center text-xs text-slate-300 transition hover:bg-white/10"
          >
            View Full Profile →
          </a>
        </div>
      )}
    </div>
  );
}
