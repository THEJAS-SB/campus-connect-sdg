import { createClient } from "@/lib/supabase/server";
import { notifyBadgeEarned } from "@/app/actions/notifications";

export interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  criteria: {
    type: string;
    count?: number;
    stage?: string;
    threshold?: number;
  };
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badges: Badge;
}

/**
 * Get all available badges
 */
export async function getAllBadges(): Promise<Badge[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("badges")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to fetch badges: ${error.message}`);
  return data ?? [];
}

/**
 * Get badges earned by a user
 */
export async function getUserBadges(userId: string): Promise<UserBadge[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_badges")
    .select(
      `
      id,
      user_id,
      badge_id,
      earned_at,
      badges(
        id,
        name,
        description,
        icon_url,
        criteria,
        created_at
      )
    `,
    )
    .eq("user_id", userId)
    .order("earned_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch user badges: ${error.message}`);

  // Transform the data to match UserBadge interface
  // Supabase returns badges as an array, but we know it's a single object due to FK
  return (data || []).map((item: any) => ({
    ...item,
    badges: Array.isArray(item.badges) ? item.badges[0] : item.badges,
  })) as UserBadge[];
}

/**
 * Check and award badges to a user based on their current stats
 */
export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const newlyEarned: string[] = [];

  // Get user profile and stats
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, innovation_score, streak_count")
    .eq("id", userId)
    .single();

  if (!profile) return [];

  // Get user's existing badges
  const existingBadges = await getUserBadges(userId);
  const earnedBadgeIds = existingBadges.map((ub) => ub.badge_id);

  // Get all badges
  const allBadges = await getAllBadges();

  // Check each badge criteria
  for (const badge of allBadges) {
    if (earnedBadgeIds.includes(badge.id)) continue; // Already earned

    const earned = await checkBadgeCriteria(badge, userId, profile);
    if (earned) {
      // Award the badge
      await supabase.from("user_badges").insert({
        user_id: userId,
        badge_id: badge.id,
      });
      newlyEarned.push(badge.name);

      // Send notification
      await notifyBadgeEarned(userId, badge.name);
    }
  }

  return newlyEarned;
}

/**
 * Check if a specific badge criterion is met
 */
async function checkBadgeCriteria(
  badge: Badge,
  userId: string,
  profile: { innovation_score: number | null; streak_count: number | null },
): Promise<boolean> {
  const supabase = await createClient();
  const { type, count, stage, threshold } = badge.criteria;

  switch (type) {
    case "profile_complete": {
      const { data: p } = await supabase
        .from("profiles")
        .select("full_name, bio, skills, sdgs")
        .eq("id", userId)
        .single();
      return !!(
        p?.full_name &&
        p?.bio &&
        p?.skills &&
        p.skills.length > 0 &&
        p?.sdgs &&
        p.sdgs.length > 0
      );
    }

    case "startup_created": {
      const { count: startupCount } = await supabase
        .from("startups")
        .select("*", { count: "exact", head: true })
        .eq("student_id", userId);
      return (startupCount ?? 0) >= (count ?? 1);
    }

    case "startup_stage": {
      const { data: startups } = await supabase
        .from("startups")
        .select("stage")
        .eq("student_id", userId);
      return startups?.some((s) => s.stage === stage) ?? false;
    }

    case "missions_completed": {
      const { count: missionCount } = await supabase
        .from("missions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_completed", true);
      return (missionCount ?? 0) >= (count ?? 10);
    }

    case "streak_days": {
      return (profile.streak_count ?? 0) >= (count ?? 7);
    }

    case "mentor_connections": {
      const { count: mentorCount } = await supabase
        .from("matches")
        .select("*", { count: "exact", head: true })
        .eq("student_id", userId)
        .not("mentor_id", "is", null)
        .eq("status", "active");
      return (mentorCount ?? 0) >= (count ?? 5);
    }

    case "innovation_score": {
      return (profile.innovation_score ?? 0) >= (threshold ?? 1000);
    }

    default:
      return false;
  }
}

/**
 * Award a specific badge to a user manually
 */
export async function awardBadge(
  userId: string,
  badgeId: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("user_badges").insert({
    user_id: userId,
    badge_id: badgeId,
  });

  if (error) {
    // Ignore duplicate constraint errors
    if (!error.message.includes("duplicate")) {
      throw new Error(`Failed to award badge: ${error.message}`);
    }
  }
}

/**
 * Get badge progress for a user (for badges not yet earned)
 */
export async function getBadgeProgress(
  userId: string,
): Promise<
  { badge: Badge; progress: number; target: number; earned: boolean }[]
> {
  const supabase = await createClient();
  const [allBadges, userBadges, profile] = await Promise.all([
    getAllBadges(),
    getUserBadges(userId),
    supabase
      .from("profiles")
      .select("id, innovation_score, streak_count")
      .eq("id", userId)
      .single(),
  ]);

  if (!profile.data) return [];

  const earnedBadgeIds = userBadges.map((ub) => ub.badge_id);

  const progress = await Promise.all(
    allBadges.map(async (badge) => {
      const earned = earnedBadgeIds.includes(badge.id);
      const { current, target } = await getBadgeCriteriaProgress(
        badge,
        userId,
        profile.data!,
      );

      return {
        badge,
        progress: current,
        target,
        earned,
      };
    }),
  );

  return progress;
}

/**
 * Get progress for a specific badge criterion
 */
async function getBadgeCriteriaProgress(
  badge: Badge,
  userId: string,
  profile: { innovation_score: number | null; streak_count: number | null },
): Promise<{ current: number; target: number }> {
  const supabase = await createClient();
  const { type, count, threshold } = badge.criteria;

  switch (type) {
    case "profile_complete": {
      const { data: p } = await supabase
        .from("profiles")
        .select("full_name, bio, skills, sdgs")
        .eq("id", userId)
        .single();
      const completed = [
        !!p?.full_name,
        !!p?.bio,
        !!(p?.skills && p.skills.length > 0),
        !!(p?.sdgs && p.sdgs.length > 0),
      ].filter(Boolean).length;
      return { current: completed, target: 4 };
    }

    case "startup_created": {
      const { count: startupCount } = await supabase
        .from("startups")
        .select("*", { count: "exact", head: true })
        .eq("student_id", userId);
      return { current: startupCount ?? 0, target: count ?? 1 };
    }

    case "startup_stage": {
      const { data: startups } = await supabase
        .from("startups")
        .select("stage")
        .eq("student_id", userId);
      const hasStage =
        startups?.some((s) => s.stage === badge.criteria.stage) ?? false;
      return { current: hasStage ? 1 : 0, target: 1 };
    }

    case "missions_completed": {
      const { count: missionCount } = await supabase
        .from("missions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("is_completed", true);
      return { current: missionCount ?? 0, target: count ?? 10 };
    }

    case "streak_days": {
      return { current: profile.streak_count ?? 0, target: count ?? 7 };
    }

    case "mentor_connections": {
      const { count: mentorCount } = await supabase
        .from("matches")
        .select("*", { count: "exact", head: true })
        .eq("student_id", userId)
        .not("mentor_id", "is", null)
        .eq("status", "active");
      return { current: mentorCount ?? 0, target: count ?? 5 };
    }

    case "innovation_score": {
      return {
        current: profile.innovation_score ?? 0,
        target: threshold ?? 1000,
      };
    }

    default:
      return { current: 0, target: 1 };
  }
}
