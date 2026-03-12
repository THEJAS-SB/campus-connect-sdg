import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/shared/Navbar";
import InvestorProfileEditForm from "@/components/investor/InvestorProfileEditForm";
import AvatarUpload from "@/components/student/AvatarUpload";

export const dynamic = "force-dynamic";

export default async function InvestorProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/sign-in");

  // Portfolio stats
  const { data: pipeline } = await supabase
    .from("investor_pipeline")
    .select("stage, investment_amount")
    .eq("investor_id", user.id);

  const totalTracked = pipeline?.length ?? 0;
  const invested = pipeline?.filter((p) => p.stage === "invested").length ?? 0;
  const totalInvested =
    pipeline
      ?.filter((p) => p.investment_amount)
      .reduce((sum, p) => sum + (p.investment_amount ?? 0), 0) ?? 0;

  return (
    <div className="min-h-full">
      <Navbar title="Investor Profile" subtitle={`RS ID: ${profile.rs_id}`} />

      <div className="mx-auto max-w-5xl space-y-8 p-6">
        {/* Profile Card */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
          <div className="flex items-start gap-8">
            {/* Avatar */}
            <div className="flex-shrink-0 w-52">
              <AvatarUpload currentAvatarUrl={profile.avatar_url ?? null} />
            </div>

            {/* Info */}
            <div className="flex-1 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-400">
                  RS ID
                </label>
                <div className="mt-1 font-mono text-lg font-bold text-green-400">
                  {profile.rs_id}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-slate-400">
                    Full Name
                  </label>
                  <div className="mt-1 text-lg text-white">
                    {profile.full_name || "Not set"}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-400">
                    Email
                  </label>
                  <div className="mt-1 text-lg text-white">{profile.email}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-400">
                    Institution
                  </label>
                  <div className="mt-1 text-lg text-white">
                    {profile.institution || "Not set"}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-400">
                    Department
                  </label>
                  <div className="mt-1 text-lg text-white">
                    {profile.department || "Not set"}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-400">
                    Phone Number
                  </label>
                  <div className="mt-1 text-lg text-white">
                    {profile.phone_number || "Not set"}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-400">
                    LinkedIn ID
                  </label>
                  <div className="mt-1 text-lg text-white">
                    {profile.linkedin_url || "Not set"}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-400">
                  Bio
                </label>
                <div className="mt-1 text-white">
                  {profile.bio || "Tell us about your investment focus..."}
                </div>
              </div>

              {profile.skills && profile.skills.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-slate-400">
                    Expertise
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {profile.skills.map((skill: string) => (
                      <span
                        key={skill}
                        className="rounded-full bg-green-500/20 px-3 py-1 text-sm text-green-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.sdgs && profile.sdgs.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-slate-400">
                    SDG Focus
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {profile.sdgs.map((sdg: number) => (
                      <span
                        key={sdg}
                        className="rounded-full bg-blue-500/20 px-3 py-1 text-sm text-blue-300"
                      >
                        SDG {sdg}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Editable profile form */}
        <InvestorProfileEditForm
          profile={{
            email: profile.email,
            full_name: profile.full_name,
            bio: profile.bio,
            institution: profile.institution,
            department: profile.department,
            phone_number: profile.phone_number,
            linkedin_url: profile.linkedin_url,
            skills: profile.skills,
            interests: profile.interests,
            sdgs: profile.sdgs,
          }}
        />

        {/* Portfolio Stats */}
        <div className="grid grid-cols-3 gap-6">
          <div className="rounded-xl border border-green-500/20 bg-linear-to-br from-green-500/10 to-green-600/5 p-6 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold text-white">{totalTracked}</div>
            <div className="mt-1 text-sm text-slate-400">Startups Tracked</div>
          </div>
          <div className="rounded-xl border border-blue-500/20 bg-linear-to-br from-blue-500/10 to-blue-600/5 p-6 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold text-white">{invested}</div>
            <div className="mt-1 text-sm text-slate-400">Invested</div>
          </div>
          <div className="rounded-xl border border-yellow-500/20 bg-linear-to-br from-yellow-500/10 to-yellow-600/5 p-6 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold text-white">
              ${(totalInvested / 1000).toFixed(0)}k
            </div>
            <div className="mt-1 text-sm text-slate-400">Total Invested</div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <a
            href="/investor/discover"
            className="rounded-xl border border-green-500/30 bg-green-500/10 p-5 text-center transition hover:border-green-500/50 hover:bg-green-500/20"
          >
            <p className="text-2xl">🔍</p>
            <p className="mt-2 font-semibold text-white">Discover Startups</p>
            <p className="mt-1 text-sm text-slate-400">
              Find AI-matched investment opportunities
            </p>
          </a>
          <a
            href="/investor/pipeline"
            className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-5 text-center transition hover:border-blue-500/50 hover:bg-blue-500/20"
          >
            <p className="text-2xl">📋</p>
            <p className="mt-2 font-semibold text-white">My Pipeline</p>
            <p className="mt-1 text-sm text-slate-400">
              Track your active deals and portfolio
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
