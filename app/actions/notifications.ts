"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type NotificationType =
  | "badge_earned"
  | "match_created"
  | "meeting_scheduled"
  | "mission_reminder"
  | "streak_warning"
  | "startup_milestone"
  | "investment_added";

/**
 * Get user's notifications
 */
export async function getMyNotifications(limit: number = 20) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch notifications: ${error.message}`);

  return data ?? [];
}

/**
 * Get unread notification count
 */
export async function getUnreadCount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  return count ?? 0;
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  revalidatePath("/notifications");
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  revalidatePath("/notifications");
}

/**
 * Create a notification
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  actionUrl?: string,
) {
  const supabase = await createClient();

  await supabase.from("notifications").insert({
    user_id: userId,
    type,
    title,
    message,
    action_url: actionUrl,
  });

  revalidatePath("/notifications");
}

/**
 * Send streak warning notification
 */
export async function sendStreakWarning(userId: string, streakDays: number) {
  await createNotification(
    userId,
    "streak_warning",
    "🔥 Your streak is at risk!",
    `You have a ${streakDays}-day streak. Log in daily to keep it alive!`,
    "/student/missions",
  );
}

/**
 * Send mission reminder notification
 */
export async function sendMissionReminder(userId: string) {
  await createNotification(
    userId,
    "mission_reminder",
    "🎯 Daily missions available!",
    "Complete today's missions to earn XP and maintain your streak.",
    "/student/missions",
  );
}

/**
 * Notify about new badge earned
 */
export async function notifyBadgeEarned(userId: string, badgeName: string) {
  await createNotification(
    userId,
    "badge_earned",
    "🏆 New Badge Earned!",
    `Congratulations! You've earned the "${badgeName}" badge.`,
    "/student/profile",
  );
}

/**
 * Notify about new match
 */
export async function notifyNewMatch(
  userId: string,
  matchName: string,
  matchType: "mentor" | "investor",
) {
  await createNotification(
    userId,
    "match_created",
    "🤝 New Match Found!",
    `You've been matched with ${matchName}, a ${matchType}. Check it out!`,
    matchType === "mentor" ? "/student/matches" : "/student",
  );
}

/**
 * Notify about meeting scheduled
 */
export async function notifyMeetingScheduled(
  userId: string,
  meetingTitle: string,
  meetingTime: string,
) {
  await createNotification(
    userId,
    "meeting_scheduled",
    "📅 Meeting Scheduled",
    `${meetingTitle} scheduled for ${new Date(meetingTime).toLocaleString()}`,
    "/mentor/meetings",
  );
}
