import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/shared/Navbar";
import DynamicAvatar from "@/components/student/DynamicAvatar";
import StartupStepper from "@/components/student/StartupStepper";
import DailyMissions from "@/components/student/DailyMissions";
import ShareButton from "@/components/student/ShareButton";
import RecommendedCompetitions from "@/components/student/RecommendedCompetitions";
import { fetchOrGenerateMissions } from "@/app/actions/missions";
import { getRecommendedCompetitions } from "@/app/actions/competitions";

export const dynamic = "force-dynamic";

export default async function StudentDashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: startup }, missions] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "rs_id, full_name, innovation_score, streak_count, avatar_state, skills",
      )
      .eq("id", user!.id)
      .single(),
    supabase
      .from("startups")
      .select("id, name:title, stage")
      .eq("student_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    fetchOrGenerateMissions().catch(() => []),
  ]);

  // Fetch competition recommendations when student has no startup
  const competitions = !startup
    ? await getRecommendedCompetitions(profile?.skills ?? [])
    : [];

  return (
    <div className="min-h-full">
      <Navbar
        title="Student Dashboard"
        subtitle={`RS ID: ${profile?.rs_id ?? ""}`}
      />

      <div className="p-6">
        {/* Welcome Banner */}
        <div className="mb-6 rounded-xl border border-purple-500/20 bg-gradient-to-r from-purple-900/30 to-slate-900/30 p-5">
          <h2 className="text-lg font-semibold text-white">
            Welcome back, {profile?.full_name?.split(" ")[0] ?? "Student"} 👋
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Keep building—every action increases your Innovation Score.
          </p>
        </div>

        {/* Quick stats */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
            <p className="text-xl font-bold text-white">
              {(profile?.innovation_score ?? 0).toLocaleString()}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">Innovation Score</p>
          </div>
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
            <p className="text-xl font-bold text-white">
              {profile?.streak_count ?? 0} days
            </p>
            <p className="mt-0.5 text-xs text-slate-400">Day Streak</p>
          </div>
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <p className="text-xl font-bold capitalize text-white">
              {startup?.stage ?? "No startup"}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">Startup Stage</p>
          </div>
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
            <p className="text-xl font-bold text-white">
              {
                missions.filter(
                  (m: { is_completed: boolean }) => m.is_completed,
                ).length
              }
              /{missions.length}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">Missions Today</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Avatar column */}
          <div className="flex flex-col items-center rounded-xl border border-white/10 bg-white/5 p-6">
            <DynamicAvatar
              state={
                (profile?.avatar_state ?? "idle") as
                  | "idle"
                  | "excited"
                  | "running"
                  | "celebrating"
                  | "sad"
              }
              innovationScore={profile?.innovation_score ?? 0}
              streakDays={profile?.streak_count ?? 0}
            />
            {startup && (
              <div className="mt-6 w-full">
                <ShareButton
                  milestone={startup.stage.toUpperCase()}
                  rsId={profile?.rs_id ?? ""}
                  startupName={startup.name}
                />
              </div>
            )}
          </div>

          {/* Startup + Missions column */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            {startup ? (
              <StartupStepper
                startupId={startup.id}
                currentStage={
                  startup.stage as
                    | "idea"
                    | "mvp"
                    | "revenue"
                    | "funded"
                    | "scaling"
                }
                startupName={startup.name}
              />
            ) : (
              <div className="space-y-5">
                {/* Cold-start welcome */}
                <div className="rounded-xl border border-dashed border-purple-500/30 bg-linear-to-br from-purple-900/20 to-slate-900/20 p-6 text-center">
                  <p className="text-3xl">🚀</p>
                  <p className="mt-2 font-semibold text-white">
                    Ready to build your Innovation Score?
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Start by joining a competition or register your startup
                    idea!
                  </p>
                  <a
                    href="/student/startup"
                    className="mt-4 inline-block rounded-lg bg-purple-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-purple-500"
                  >
                    Register Startup
                  </a>
                </div>

                {/* Competition Matchmaker */}
                <RecommendedCompetitions competitions={competitions} />
              </div>
            )}
            {missions.length > 0 && <DailyMissions missions={missions} />}
          </div>
        </div>
      </div>
    </div>
  );
}
