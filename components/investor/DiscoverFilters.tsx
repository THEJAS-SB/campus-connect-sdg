"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const STAGES = ["idea", "mvp", "revenue", "funded", "scaling"];
const DOMAINS = [
  "FinTech",
  "EdTech",
  "HealthTech",
  "AgriTech",
  "AI/ML",
  "Web3 / Blockchain",
  "SaaS",
  "GreenTech",
];
const SDG_NAMES = [
  "No Poverty",
  "Zero Hunger",
  "Good Health",
  "Quality Education",
  "Gender Equality",
  "Clean Water",
  "Affordable Energy",
  "Decent Work",
  "Industry Innovation",
  "Reduced Inequalities",
  "Sustainable Cities",
  "Responsible Consumption",
  "Climate Action",
  "Life Below Water",
  "Life on Land",
  "Peace and Justice",
  "Partnerships",
];

const selectClass =
  "rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none";

export default function DiscoverFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const stage = params.get("stage") ?? "";
  const domain = params.get("domain") ?? "";
  const sdg = params.get("sdg") ?? "";

  function apply(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    startTransition(() => {
      router.push(`/investor/discover?${next.toString()}`);
    });
  }

  function clearAll() {
    startTransition(() => {
      router.push("/investor/discover");
    });
  }

  const hasFilters = stage || domain || sdg;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <select
        value={stage}
        onChange={(e) => apply("stage", e.target.value)}
        disabled={isPending}
        className={selectClass}
      >
        <option value="">All Stages</option>
        {STAGES.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>

      <select
        value={domain}
        onChange={(e) => apply("domain", e.target.value)}
        disabled={isPending}
        className={selectClass}
      >
        <option value="">All Domains</option>
        {DOMAINS.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      <select
        value={sdg}
        onChange={(e) => apply("sdg", e.target.value)}
        disabled={isPending}
        className={selectClass}
      >
        <option value="">All SDGs</option>
        {SDG_NAMES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {hasFilters && (
        <button
          onClick={clearAll}
          disabled={isPending}
          className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-400 transition hover:bg-white/5 disabled:opacity-50"
        >
          ✕ Clear
        </button>
      )}

      {isPending && <span className="text-xs text-slate-500">Loading…</span>}
    </div>
  );
}
