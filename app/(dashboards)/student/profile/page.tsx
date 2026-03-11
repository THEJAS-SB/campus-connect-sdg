import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getMyBadges } from "@/app/actions/badges";
import BadgeShowcase from "@/components/shared/BadgeShowcase";
import CheckBadgesButton from "@/components/shared/CheckBadgesButton";
import ProfileEditForm from "@/components/student/ProfileEditForm";

export default async function StudentProfilePage() {
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

  // Get badges and progress
  const { earned, all, progress } = await getMyBadges();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white">Your Profile</h1>
          <p className="mt-2 text-lg text-slate-400">
            Manage your information and track your achievements
          </p>
        </div>

        {/* Profile Card */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
          <div className="flex items-start gap-8">
            {/* Avatar */}
            <div className="h-32 w-32 flex-shrink-0 overflow-hidden rounded-full border-4 border-sky-500/30 bg-gradient-to-br from-sky-500/20 to-blue-500/20">
              <div className="flex h-full w-full items-center justify-center text-6xl">
                {profile.avatar_state === "excited" && "🎉"}
                {profile.avatar_state === "celebrating" && "🏆"}
                {profile.avatar_state === "running" && "🚀"}
                {profile.avatar_state === "thinking" && "🤔"}
                {profile.avatar_state === "sad" && "😢"}
                {profile.avatar_state === "idle" && "✨"}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-400">
                  RS ID
                </label>
                <div className="mt-1 font-mono text-lg font-bold text-sky-400">
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
                  {profile.bio || "Tell us about yourself..."}
                </div>
              </div>

              {/* Skills */}
              {profile.skills && profile.skills.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-slate-400">
                    Skills
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {profile.skills.map((skill: string) => (
                      <span
                        key={skill}
                        className="rounded-full bg-sky-500/20 px-3 py-1 text-sm text-sky-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* SDGs */}
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

          {/* Edit Profile */}
          <ProfileEditForm profile={{ email: profile.email, full_name: profile.full_name, bio: profile.bio, institution: profile.institution, department: profile.department, phone_number: profile.phone_number, linkedin_url: profile.linkedin_url, skills: profile.skills }} />
        </div>

        {/* Badges & Achievements */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              Badges & Achievements 🏆
            </h2>
            <CheckBadgesButton />
          </div>
          <BadgeShowcase
            userBadges={earned}
            allBadges={all}
            progress={progress}
          />
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-6">
          <div className="rounded-xl border border-sky-500/20 bg-gradient-to-br from-sky-500/10 to-sky-600/5 p-6 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold text-white">
              {profile.innovation_score}
            </div>
            <div className="mt-1 text-sm text-slate-400">Innovation Score</div>
          </div>

          <div className="rounded-xl border border-green-500/20 bg-gradient-to-br from-green-500/10 to-green-600/5 p-6 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold text-white">
              {profile.streak_count}
            </div>
            <div className="mt-1 text-sm text-slate-400">Day Streak</div>
          </div>

          <div className="rounded-xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 p-6 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold text-white">{earned.length}</div>
            <div className="mt-1 text-sm text-slate-400">Badges Earned</div>
          </div>
        </div>
      </div>
    </div>
  );
}
