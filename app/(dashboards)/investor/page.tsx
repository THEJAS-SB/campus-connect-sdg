import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/shared/Navbar";
import PipelineBoard from "@/components/investor/PipelineBoard";
import {
  getInvestorPipeline,
  getInvestorAnalytics,
} from "@/app/actions/investor";

export const dynamic = "force-dynamic";

export default async function InvestorDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, pipeline, analytics] = await Promise.all([
    supabase
      .from("profiles")
      .select("rs_id, full_name")
      .eq("id", user!.id)
      .single(),
    getInvestorPipeline(),
    getInvestorAnalytics(),
  ]);

  return (
    <div className="min-h-full">
      <Navbar
        title="Investor Dashboard"
        subtitle={`RS ID: ${profile?.rs_id ?? ""}`}
      />
      <div className="p-6">
        {/* Welcome */}
        <div className="mb-6 rounded-xl border border-green-500/20 bg-gradient-to-r from-green-900/30 to-slate-900/30 p-5">
          <h2 className="text-lg font-semibold text-white">
            Welcome, {profile?.full_name?.split(" ")[0]} 💼
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Discover and track vetted campus startups.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total Tracked", value: pipeline.length },
            { label: "In Talks", value: analytics.byStage.in_talks || 0 },
            {
              label: "Due Diligence",
              value: analytics.byStage.due_diligence || 0,
            },
            { label: "Invested", value: analytics.byStage.invested || 0 },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-white/10 bg-white/5 p-4"
            >
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Total Invested */}
        {analytics.totalInvested > 0 && (
          <div className="mb-6 rounded-xl border border-green-500/20 bg-green-500/5 p-4">
            <p className="text-xs text-green-400">Total Invested</p>
            <p className="text-2xl font-bold text-green-300">
              ${analytics.totalInvested.toLocaleString()}
            </p>
          </div>
        )}

        {/* Pipeline Kanban */}
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-white">Investment Pipeline</h3>
            <a
              href="/investor/discover"
              className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-purple-700"
            >
              + Discover Startups
            </a>
          </div>
          <PipelineBoard initialPipeline={pipeline} />
        </div>
      </div>
    </div>
  );
}
