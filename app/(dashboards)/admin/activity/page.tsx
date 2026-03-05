import { getRecentActivity } from "@/app/actions/admin";
import Navbar from "@/components/shared/Navbar";

export const dynamic = "force-dynamic";

const ACTIVITY_ICONS: Record<string, string> = {
  profile_created: "👤",
  startup_created: "🚀",
  startup_updated: "✏️",
  match_created: "🤝",
  match_accepted: "✅",
  mission_completed: "🎯",
  badge_earned: "🏆",
  meeting_scheduled: "📅",
  pipeline_updated: "📊",
  investment_added: "💰",
};

const ACTIVITY_COLORS: Record<string, string> = {
  profile_created: "border-blue-500/30 bg-blue-500/5",
  startup_created: "border-purple-500/30 bg-purple-500/5",
  startup_updated: "border-slate-500/30 bg-slate-500/5",
  match_created: "border-pink-500/30 bg-pink-500/5",
  match_accepted: "border-green-500/30 bg-green-500/5",
  mission_completed: "border-yellow-500/30 bg-yellow-500/5",
  badge_earned: "border-amber-500/30 bg-amber-500/5",
  meeting_scheduled: "border-teal-500/30 bg-teal-500/5",
  pipeline_updated: "border-indigo-500/30 bg-indigo-500/5",
  investment_added: "border-green-500/30 bg-green-500/5",
};

export default async function ActivityMonitor() {
  const activities = await getRecentActivity(100);

  return (
    <div className="min-h-full">
      <Navbar title="Activity Monitor" subtitle="Real-time platform events" />
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-400">Last 100 activities</p>
          <p className="text-xs text-slate-500">Auto-refreshes on page load</p>
        </div>

        {activities.length === 0 ? (
          <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-dashed border-white/20">
            <div className="text-center">
              <p className="text-3xl">📊</p>
              <p className="mt-2 font-medium text-slate-300">No activity yet</p>
              <p className="mt-1 text-sm text-slate-500">
                Platform activity will appear here
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {activities.map((activity) => {
              const profile = Array.isArray(activity.profiles)
                ? activity.profiles[0]
                : activity.profiles;
              const activityType = activity.activity_type;
              const icon = ACTIVITY_ICONS[activityType] ?? "📌";
              const color =
                ACTIVITY_COLORS[activityType] ?? "border-white/10 bg-white/5";
              const timestamp = new Date(activity.created_at);
              const timeAgo = getTimeAgo(timestamp);

              return (
                <div
                  key={activity.id}
                  className={`rounded-lg border p-4 ${color}`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{icon}</span>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-white">
                            {profile?.full_name ?? "Unknown User"}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {profile?.role && (
                              <span className="capitalize">{profile.role}</span>
                            )}
                            {profile?.rs_id && (
                              <span className="ml-2 text-slate-500">
                                RS: {profile.rs_id}
                              </span>
                            )}
                          </p>
                        </div>
                        <span className="text-xs text-slate-500">
                          {timeAgo}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-slate-300">
                        {formatActivityMessage(activityType, activity.metadata)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatActivityMessage(type: string, metadata: any): string {
  switch (type) {
    case "profile_created":
      return "Joined the platform";
    case "startup_created":
      return `Created startup: ${metadata?.startup_name ?? "Unknown"}`;
    case "startup_updated":
      return `Updated startup to ${metadata?.stage ?? "new stage"}`;
    case "match_created":
      return "New match created";
    case "match_accepted":
      return "Accepted mentorship connection";
    case "mission_completed":
      return `Completed mission: ${metadata?.mission_title ?? "Daily task"}`;
    case "badge_earned":
      return `Earned badge: ${metadata?.badge_name ?? "Achievement"}`;
    case "meeting_scheduled":
      return "Scheduled a meeting";
    case "pipeline_updated":
      return `Moved startup to ${metadata?.stage ?? "new stage"}`;
    case "investment_added":
      return `Added $${metadata?.amount?.toLocaleString() ?? "0"} investment`;
    default:
      return type.replace(/_/g, " ");
  }
}
