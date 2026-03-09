import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/shared/Navbar";
import DailyMissions from "@/components/student/DailyMissions";
import { fetchOrGenerateMissions } from "@/app/actions/missions";

export const dynamic = "force-dynamic";

export default async function StudentMissionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, missions] = await Promise.all([
    supabase
      .from("profiles")
      .select("innovation_score, streak_count")
      .eq("id", user!.id)
      .single(),
    fetchOrGenerateMissions().catch(() => []),
  ]);

  const completedCount = missions.filter(
    (m: { is_completed: boolean }) => m.is_completed,
  ).length;

  return (
    <div className="min-h-full">
      <Navbar
        title="Daily Missions"
        subtitle="AI-generated tasks to level up"
      />
      <div className="p-6">
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 text-center">
            <p className="text-2xl font-bold text-white">
              {(profile?.innovation_score ?? 0).toLocaleString()}
            </p>
            <p className="text-xs text-slate-400">Total XP</p>
          </div>
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 text-center">
            <p className="text-2xl font-bold text-white">
              🔥 {profile?.streak_count ?? 0}
            </p>
            <p className="text-xs text-slate-400">Day Streak</p>
          </div>
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 text-center">
            <p className="text-2xl font-bold text-white">{completedCount}</p>
            <p className="text-xs text-slate-400">Completed Today</p>
          </div>
        </div>

        {missions.length > 0 ? (
          <DailyMissions missions={missions} />
        ) : (
          <div className="rounded-xl border border-dashed border-white/20 p-12 text-center">
            <p className="text-3xl">⚡</p>
            <p className="mt-2 font-medium text-slate-300">
              Generating your missions…
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Refresh the page in a moment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
