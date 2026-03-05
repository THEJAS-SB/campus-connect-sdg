import { createClient } from "@/lib/supabase/server";
import { sendStreakWarning } from "@/app/actions/notifications";

/**
 * Update user's login streak and send warnings if needed
 * Call this on every page load for authenticated users
 */
export async function updateLoginStreak(userId: string): Promise<{
  streakCount: number;
  isNewDay: boolean;
  streakWarning: boolean;
}> {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("streak_count, last_login_date")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    return { streakCount: 0, isNewDay: false, streakWarning: false };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastLogin = profile.last_login_date
    ? new Date(profile.last_login_date)
    : null;
  const lastLoginDate = lastLogin
    ? new Date(
        lastLogin.getFullYear(),
        lastLogin.getMonth(),
        lastLogin.getDate(),
      )
    : null;

  // Calculate days since last login
  const daysSinceLastLogin = lastLoginDate
    ? Math.floor(
        (today.getTime() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24),
      )
    : null;

  let newStreakCount = profile.streak_count ?? 0;
  let isNewDay = false;
  let streakWarning = false;

  if (daysSinceLastLogin === null) {
    // First login ever
    newStreakCount = 1;
    isNewDay = true;
  } else if (daysSinceLastLogin === 0) {
    // Same day login - no change
    newStreakCount = profile.streak_count ?? 0;
    isNewDay = false;
  } else if (daysSinceLastLogin === 1) {
    // Next day login - increment streak
    newStreakCount = (profile.streak_count ?? 0) + 1;
    isNewDay = true;
  } else {
    // Missed days - reset streak
    newStreakCount = 1;
    isNewDay = true;
  }

  // Update profile with new streak and login date
  if (isNewDay) {
    await supabase
      .from("profiles")
      .update({
        streak_count: newStreakCount,
        last_login_date: now.toISOString(),
      })
      .eq("id", userId);

    // Send streak warning if at 6+ days (one day before potential 7-day streak reset)
    if (newStreakCount >= 6 && daysSinceLastLogin === 1) {
      await sendStreakWarning(userId, newStreakCount);
      streakWarning = true;
    }
  }

  return { streakCount: newStreakCount, isNewDay, streakWarning };
}

/**
 * Check if user has missed their streak and send warning
 * Call this via a daily cron job
 */
export async function checkStreakWarnings(): Promise<void> {
  const supabase = await createClient();

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayDate = new Date(
    yesterday.getFullYear(),
    yesterday.getMonth(),
    yesterday.getDate(),
  );

  // Find users whose last login was yesterday and have a streak of 3+ days
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, streak_count, last_login_date, email")
    .gte("streak_count", 3)
    .lt("last_login_date", now.toISOString());

  if (!profiles) return;

  for (const profile of profiles) {
    const lastLogin = profile.last_login_date
      ? new Date(profile.last_login_date)
      : null;
    if (!lastLogin) continue;

    const lastLoginDate = new Date(
      lastLogin.getFullYear(),
      lastLogin.getMonth(),
      lastLogin.getDate(),
    );

    const daysSinceLastLogin = Math.floor(
      (now.getTime() - lastLoginDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // If last login was yesterday, send warning
    if (daysSinceLastLogin === 1) {
      await sendStreakWarning(profile.id, profile.streak_count ?? 0);
    }
  }
}
