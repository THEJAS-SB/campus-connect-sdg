import { createClient } from "@/lib/supabase/server";
import { getAdminKPIs, getUserGrowthMetrics } from "@/app/actions/admin";
import Navbar from "@/components/shared/Navbar";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, kpis, growth] = await Promise.all([
    supabase
      .from("profiles")
      .select("rs_id, full_name")
      .eq("id", user!.id)
      .single(),
    getAdminKPIs(),
    getUserGrowthMetrics(),
  ]);

  if (!kpis) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-400">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <Navbar
        title="Admin Intelligence"
        subtitle={`RS ID: ${profile?.rs_id ?? ""}`}
      />

      <div className="p-6">
        {/* Welcome */}
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-linear-to-r from-amber-900/20 to-slate-900/30 p-5">
          <h2 className="text-lg font-semibold text-white">
            Welcome, {profile?.full_name?.split(" ")[0]} 🏛️
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Here&apos;s a real-time view of your institution&apos;s innovation
            ecosystem.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-purple-500/30 bg-purple-500/5 p-4">
            <p className="text-xs text-slate-400">Total Users</p>
            <p className="mt-2 text-3xl font-bold text-white">
              {kpis.users.total}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {kpis.users.students} Students · {kpis.users.mentors} Mentors
            </p>
          </div>
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
            <p className="text-xs text-slate-400">Total Startups</p>
            <p className="mt-2 text-3xl font-bold text-white">
              {kpis.startups.total}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {kpis.startups.by_stage.mvp ?? 0} in MVP stage
            </p>
          </div>
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
            <p className="text-xs text-slate-400">Avg Innovation Score</p>
            <p className="mt-2 text-3xl font-bold text-white">
              {kpis.innovation_score_avg}
            </p>
            <p className="mt-1 text-xs text-slate-500">Across all students</p>
          </div>
          <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4">
            <p className="text-xs text-slate-400">Total Funding</p>
            <p className="mt-2 text-3xl font-bold text-white">
              ${(kpis.funding.total / 1000).toFixed(0)}K
            </p>
            <p className="mt-1 text-xs text-slate-500">Raised by startups</p>
          </div>
        </div>

        {/* Engagement Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-pink-500/30 bg-pink-500/5 p-4">
            <p className="text-xs text-slate-400">Active Matches</p>
            <p className="mt-2 text-2xl font-bold text-white">
              {kpis.engagement.active_matches}
            </p>
          </div>
          <div className="rounded-xl border border-teal-500/30 bg-teal-500/5 p-4">
            <p className="text-xs text-slate-400">Active Mentorships</p>
            <p className="mt-2 text-2xl font-bold text-white">
              {kpis.engagement.active_mentorships}
            </p>
          </div>
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
            <p className="text-xs text-slate-400">Activity (24h)</p>
            <p className="mt-2 text-2xl font-bold text-white">
              {kpis.engagement.activity_24h}
            </p>
          </div>
        </div>

        {/* Quick nav */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <a
            href="/admin/overview"
            className="rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-purple-500/30"
          >
            <p className="text-xl">🌐</p>
            <p className="mt-2 font-medium text-white">Ecosystem Analytics</p>
            <p className="mt-1 text-xs text-slate-400">
              Charts and visualizations
            </p>
          </a>
          <a
            href="/admin/insights"
            className="rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-purple-500/30"
          >
            <p className="text-xl">🤖</p>
            <p className="mt-2 font-medium text-white">AI Insights</p>
            <p className="mt-1 text-xs text-slate-400">
              Weekly strategic reports
            </p>
          </a>
          <a
            href="/admin/activity"
            className="rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-purple-500/30"
          >
            <p className="text-xl">👥</p>
            <p className="mt-2 font-medium text-white">Activity Monitor</p>
            <p className="mt-1 text-xs text-slate-400">
              Real-time platform logs
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
