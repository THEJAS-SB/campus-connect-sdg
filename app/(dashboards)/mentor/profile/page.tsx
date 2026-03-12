import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/shared/Navbar";
import MentorProfileEditForm from "@/components/mentor/MentorProfileEditForm";
import AvatarUpload from "@/components/student/AvatarUpload";

export const dynamic = "force-dynamic";

export default async function MentorProfilePage() {
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

  // Mentoring stats
  const { count: activeCount } = await supabase
    .from("matches")
    .select("*", { count: "exact", head: true })
    .eq("mentor_id", user.id)
    .eq("status", "active");

  const { count: completedCount } = await supabase
    .from("matches")
    .select("*", { count: "exact", head: true })
    .eq("mentor_id", user.id)
    .eq("status", "completed");

  const { count: meetingCount } = await supabase
    .from("meetings")
    .select("*", { count: "exact", head: true })
    .eq("mentor_id", user.id);

  return (
    <div className="min-h-full">
      <Navbar title="Mentor Profile" subtitle={`RS ID: ${profile.rs_id}`} />

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
                <div className="mt-1 font-mono text-lg font-bold text-blue-400">
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
                        className="text-blue-400 underline"
                      >
                        {profile.linkedin_url}
                      </a>
                    ) : (
                      "Not set"
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-400">
                  Bio / Mentoring Philosophy
                </label>
                <div className="mt-1 text-white">
                  {profile.bio || "Share your mentoring philosophy..."}
                </div>
              </div>

              {profile.skills && profile.skills.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-slate-400">
                    Expertise / Skills
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {profile.skills.map((skill: string) => (
                      <span
                        key={skill}
                        className="rounded-full bg-blue-500/20 px-3 py-1 text-sm text-blue-300"
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
                        className="rounded-full bg-purple-500/20 px-3 py-1 text-sm text-purple-300"
                      >
                        {interest}
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
                        className="rounded-full bg-green-500/20 px-3 py-1 text-sm text-green-300"
                      >
                        SDG {sdg}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Edit Form */}
          <MentorProfileEditForm
            profile={{
              email: profile.email,
              full_name: profile.full_name ?? null,
              bio: profile.bio ?? null,
              institution: profile.institution ?? null,
              department: profile.department ?? null,
              phone_number: profile.phone_number ?? null,
              linkedin_url: profile.linkedin_url ?? null,
              skills: profile.skills ?? null,
              interests: profile.interests ?? null,
              sdgs: profile.sdgs ?? null,
            }}
          />
        </div>

        {/* Mentoring Stats */}
        <div className="grid grid-cols-3 gap-6">
          <div className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-6 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold text-white">
              {activeCount ?? 0}
            </div>
            <div className="mt-1 text-sm text-slate-400">Active Mentees</div>
          </div>
          <div className="rounded-xl border border-green-500/20 bg-gradient-to-br from-green-500/10 to-green-600/5 p-6 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold text-white">
              {completedCount ?? 0}
            </div>
            <div className="mt-1 text-sm text-slate-400">
              Completed Mentorships
            </div>
          </div>
          <div className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-purple-600/5 p-6 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold text-white">
              {meetingCount ?? 0}
            </div>
            <div className="mt-1 text-sm text-slate-400">Total Meetings</div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <a
            href="/mentor/mentees"
            className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-5 text-center transition hover:border-blue-500/50 hover:bg-blue-500/20"
          >
            <p className="text-2xl">👥</p>
            <p className="mt-2 font-semibold text-white">My Mentees</p>
            <p className="mt-1 text-sm text-slate-400">
              View and manage your active connections
            </p>
          </a>
          <a
            href="/mentor/analytics"
            className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-5 text-center transition hover:border-purple-500/50 hover:bg-purple-500/20"
          >
            <p className="text-2xl">📊</p>
            <p className="mt-2 font-semibold text-white">Analytics</p>
            <p className="mt-1 text-sm text-slate-400">
              See your mentoring impact and stats
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
