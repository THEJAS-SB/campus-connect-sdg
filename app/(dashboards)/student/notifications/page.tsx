import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} from "@/app/actions/notifications";
import NotificationList from "@/components/notifications/NotificationList";

export default async function StudentNotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const notifications = await getMyNotifications(50);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">Notifications</h1>
            <p className="mt-2 text-lg text-slate-400">
              Stay updated with your latest achievements and activities
            </p>
          </div>
          {notifications.length > 0 && (
            <form action={markAllAsRead}>
              <button
                type="submit"
                className="rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-300 transition hover:bg-purple-500/20"
              >
                Mark All as Read
              </button>
            </form>
          )}
        </div>

        {/* Notifications List */}
        <NotificationList notifications={notifications} />
      </div>
    </div>
  );
}
