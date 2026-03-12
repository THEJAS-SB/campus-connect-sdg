import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/shared/Navbar";
import AdminProfileEditForm from "@/components/admin/AdminProfileEditForm";
import AvatarUpload from "@/components/student/AvatarUpload";

export const dynamic = "force-dynamic";

export default async function AdminProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "rs_id, email, full_name, bio, institution, department, phone_number, linkedin_url, skills, interests, role, created_at, avatar_url",
    )
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/sign-in");

  // Platform-wide stats for admin context
  const [
    { count: totalUsers },
    { count: totalStartups },
    { count: totalMatches },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("startups").select("*", { count: "exact", head: true }),
    supabase.from("matches").select("*", { count: "exact", head: true }),
  ]);

  return (
    <div className="min-h-full">
      <Navbar title="Admin Profile" subtitle={`RS ID: ${profile.rs_id}`} />

      <div className="mx-auto max-w-5xl space-y-8 p-6">
        {/* Profile Card */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm">
          <div className="flex items-start gap-8">
            {/* Avatar */}
            <div className="shrink-0 w-52">
              <AvatarUpload currentAvatarUrl={profile.avatar_url ?? null} />
            </div>

            {/* Info */}
            <div className="flex-1 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-400">
                  RS ID
                </label>
                <div className="mt-1 font-mono text-lg font-bold text-purple-400">
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
                    LinkedIn
                  </label>
                  <div className="mt-1 text-lg text-white">
                    {profile.linkedin_url ? (
                      <a
                        href={profile.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:underline"
                      >
                        View Profile
                      </a>
                    ) : (
                      "Not set"
                    )}
                  </div>
                </div>
              </div>

              {profile.bio && (
                <div>
                  <label className="text-sm font-medium text-slate-400">
                    Bio
                  </label>
                  <div className="mt-1 text-white">{profile.bio}</div>
                </div>
              )}

              {profile.skills && profile.skills.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-slate-400">
                    Skills
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {profile.skills.map((skill: string) => (
                      <span
                        key={skill}
                        className="rounded-full bg-purple-500/20 px-3 py-1 text-sm text-purple-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.interests && profile.interests.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-slate-400">
                    Interests
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {profile.interests.map((interest: string) => (
                      <span
                        key={interest}
                        className="rounded-full bg-slate-700/60 px-3 py-1 text-sm text-slate-300"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Edit form */}
              <AdminProfileEditForm
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
                }}
              />
            </div>
          </div>
        </div>

        {/* Platform Stats */}
        <div className="grid grid-cols-3 gap-6">
          <div className="rounded-xl border border-purple-500/20 bg-linear-to-br from-purple-500/10 to-violet-500/5 p-6 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold text-white">
              {totalUsers ?? 0}
            </div>
            <div className="mt-1 text-sm text-slate-400">Total Users</div>
          </div>
          <div className="rounded-xl border border-blue-500/20 bg-linear-to-br from-blue-500/10 to-blue-600/5 p-6 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold text-white">
              {totalStartups ?? 0}
            </div>
            <div className="mt-1 text-sm text-slate-400">Startups</div>
          </div>
          <div className="rounded-xl border border-green-500/20 bg-linear-to-br from-green-500/10 to-green-600/5 p-6 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold text-white">
              {totalMatches ?? 0}
            </div>
            <div className="mt-1 text-sm text-slate-400">Matches</div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <a
            href="/admin/overview"
            className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-5 text-center transition hover:border-purple-500/50 hover:bg-purple-500/20"
          >
            <p className="text-2xl">📈</p>
            <p className="mt-2 font-semibold text-white">Overview</p>
          </a>
          <a
            href="/admin/users"
            className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-5 text-center transition hover:border-blue-500/50 hover:bg-blue-500/20"
          >
            <p className="text-2xl">👥</p>
            <p className="mt-2 font-semibold text-white">Manage Users</p>
          </a>
          <a
            href="/admin/messaging"
            className="rounded-xl border border-green-500/30 bg-green-500/10 p-5 text-center transition hover:border-green-500/50 hover:bg-green-500/20"
          >
            <p className="text-2xl">📨</p>
            <p className="mt-2 font-semibold text-white">Broadcast</p>
          </a>
        </div>
      </div>
    </div>
  );
}
