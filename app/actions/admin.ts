"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { generateWeeklyEcosystemReport } from "@/lib/ai/groq";
import { requireRateLimit, RATE_LIMITS } from "@/lib/utils/rate-limit";
import { requireAdmin } from "@/lib/auth/session";

/**
 * Get comprehensive KPI metrics for admin dashboard
 */
export async function getAdminKPIs() {
  await requireAdmin();
  const supabase = await createClient();

  // Total students, mentors, investors
  const { data: profiles } = await supabase
    .from("profiles")
    .select("role, innovation_score");

  if (!profiles) return null;

  const studentCount = profiles.filter((p) => p.role === "student").length;
  const mentorCount = profiles.filter((p) => p.role === "mentor").length;
  const investorCount = profiles.filter((p) => p.role === "investor").length;

  const avgInnovationScore =
    profiles
      .filter((p) => p.role === "student" && p.innovation_score)
      .reduce((sum, p) => sum + (p.innovation_score ?? 0), 0) / studentCount ||
    0;

  // Total startups and funding
  const { data: startups } = await supabase
    .from("startups")
    .select("id, funding_raised, stage, domain");

  const totalStartups = startups?.length ?? 0;
  const totalFunding =
    startups?.reduce((sum, s) => sum + (s.funding_raised ?? 0), 0) ?? 0;

  const stageBreakdown =
    startups?.reduce(
      (acc, s) => {
        const stage = s.stage ?? "unknown";
        acc[stage] = (acc[stage] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ) ?? {};

  const domainBreakdown =
    startups?.reduce(
      (acc, s) => {
        const domain = s.domain ?? "Other";
        acc[domain] = (acc[domain] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ) ?? {};

  // Active matches and mentorship connections
  const { count: matchCount } = await supabase
    .from("matches")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const { count: mentorshipCount } = await supabase
    .from("matches")
    .select("*", { count: "exact", head: true })
    .eq("status", "active")
    .not("mentor_id", "is", null);

  // Recent activity
  const { data: recentActivity } = await supabase
    .from("activity_log")
    .select("activity_type, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const activityLast24h =
    recentActivity?.filter(
      (a) =>
        Date.now() - new Date(a.created_at).getTime() < 24 * 60 * 60 * 1000,
    ).length ?? 0;

  return {
    users: {
      students: studentCount,
      mentors: mentorCount,
      investors: investorCount,
      total: profiles.length,
    },
    innovation_score_avg: Math.round(avgInnovationScore),
    startups: {
      total: totalStartups,
      by_stage: stageBreakdown,
      by_domain: domainBreakdown,
    },
    funding: {
      total: totalFunding,
      by_stage:
        startups?.reduce(
          (acc, s) => {
            const stage = s.stage ?? "unknown";
            acc[stage] = (acc[stage] ?? 0) + (s.funding_raised ?? 0);
            return acc;
          },
          {} as Record<string, number>,
        ) ?? {},
    },
    engagement: {
      active_matches: matchCount ?? 0,
      active_mentorships: mentorshipCount ?? 0,
      activity_24h: activityLast24h,
    },
  };
}

/**
 * Get ecosystem charts data
 */
export async function getEcosystemCharts() {
  await requireAdmin();
  const supabase = await createClient();

  // Startup stage distribution
  const { data: startups } = await supabase
    .from("startups")
    .select("stage, created_at");

  const stageDistribution =
    startups?.reduce(
      (acc, s) => {
        const stage = s.stage ?? "unknown";
        acc[stage] = (acc[stage] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ) ?? {};

  // Mentor-mentee connections by domain
  const { data: mentorships } = await supabase
    .from("matches")
    .select(
      `
      id,
      mentor:profiles!matches_mentor_id_fkey(domain),
      mentee:profiles!matches_student_id_fkey(full_name)
    `,
    )
    .not("mentor_id", "is", null)
    .eq("status", "active");

  const connectionsByDomain =
    mentorships?.reduce(
      (acc, m) => {
        const domain = (m as any).mentor?.domain ?? "Other";
        acc[domain] = (acc[domain] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ) ?? {};

  // Trending domains over time (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: recentStartups } = await supabase
    .from("startups")
    .select("domain, created_at")
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: true });

  // Group by week and domain
  const weeklyTrends: Record<string, Record<string, number>> = {};
  recentStartups?.forEach((s) => {
    const weekStart = new Date(s.created_at);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
    const weekKey = weekStart.toISOString().split("T")[0];
    const domain = s.domain ?? "Other";

    if (!weeklyTrends[weekKey]) weeklyTrends[weekKey] = {};
    weeklyTrends[weekKey][domain] = (weeklyTrends[weekKey][domain] ?? 0) + 1;
  });

  return {
    stage_distribution: stageDistribution,
    connections_by_domain: connectionsByDomain,
    weekly_trends: weeklyTrends,
  };
}

/**
 * Generate AI-powered weekly ecosystem insight report
 */
export async function generateEcosystemInsight() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Rate limit expensive AI insights generation
  await requireRateLimit(user.id, RATE_LIMITS.AI_GROQ_INSIGHTS);

  // Check cache first
  const { data: cached } = await supabase
    .from("kpi_cache")
    .select("value")
    .eq("key", "weekly_insight")
    .single();

  if (cached) {
    const cacheData = cached.value as { report: string; timestamp: string };
    const cacheAge = Date.now() - new Date(cacheData.timestamp).getTime();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;

    // Return cached if less than 1 week old
    if (cacheAge < oneWeek) {
      return cacheData.report;
    }
  }

  // Fetch ecosystem data
  const [kpis, charts] = await Promise.all([
    getAdminKPIs(),
    getEcosystemCharts(),
  ]);

  if (!kpis) throw new Error("Failed to fetch KPIs");

  const ecosystemData = {
    totalStudents: kpis.users.students,
    totalStartups: kpis.startups.total,
    topDomains: Object.entries(kpis.startups.by_domain)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([domain]) => domain),
    stageCounts: kpis.startups.by_stage,
    totalFunding: kpis.funding.total,
  };

  // Generate AI report using Groq
  const report = await generateWeeklyEcosystemReport(ecosystemData);

  // Cache the result
  await supabase.from("kpi_cache").upsert({
    key: "weekly_insight",
    value: { report, timestamp: new Date().toISOString() },
    last_updated: new Date().toISOString(),
  });

  // This action is called during page render, so avoid revalidation here.
  return report;
}

/**
 * Get recent activity log for admin monitoring
 */
export async function getRecentActivity(limit: number = 50) {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("activity_log")
    .select(
      `
      id,
      activity_type:action_type,
      metadata:action_data,
      created_at,
      profiles!activity_log_user_id_fkey(
        full_name,
        role,
        rs_id
      )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch activity: ${error.message}`);

  return data ?? [];
}

/**
 * Get user growth metrics over time
 */
export async function getUserGrowthMetrics() {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("created_at, role")
    .order("created_at", { ascending: true });

  if (!profiles) return [];

  // Group by month
  const monthlyGrowth: Record<
    string,
    { students: number; mentors: number; investors: number }
  > = {};

  profiles.forEach((p) => {
    const month = new Date(p.created_at).toISOString().slice(0, 7); // YYYY-MM
    if (!monthlyGrowth[month]) {
      monthlyGrowth[month] = { students: 0, mentors: 0, investors: 0 };
    }
    if (p.role === "student") monthlyGrowth[month].students++;
    else if (p.role === "mentor") monthlyGrowth[month].mentors++;
    else if (p.role === "investor") monthlyGrowth[month].investors++;
  });

  return Object.entries(monthlyGrowth).map(([month, counts]) => ({
    month,
    ...counts,
  }));
}

/**
 * Refresh KPI cache (called by cron job)
 */
export async function refreshKPICache() {
  const supabase = await createClient();

  const kpis = await getAdminKPIs();
  if (!kpis) throw new Error("Failed to calculate KPIs");

  await supabase.from("kpi_cache").upsert({
    key: "dashboard_kpis",
    value: kpis,
    last_updated: new Date().toISOString(),
  });

  revalidatePath("/admin");
  return kpis;
}

// ================================================================
// Messaging / Broadcast Actions
// ================================================================

export type AudienceFilter = {
  type: "individual" | "role" | "department" | "startup_founders" | "everyone";
  value?: string; // role name, department name, or user id
};

export type Recipient = {
  id: string;
  full_name: string | null;
  email: string;
  phone_number: string | null;
  role: string;
  department: string | null;
  institution: string | null;
};

/**
 * Get distinct audience options (departments, role counts)
 */
export async function getAudienceOptions() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("role, department");

  if (!profiles) return { departments: [], roleCounts: {} };

  const departments = [
    ...new Set(
      profiles
        .map((p) => p.department)
        .filter((d): d is string => !!d && d.trim() !== ""),
    ),
  ].sort();

  const roleCounts = profiles.reduce(
    (acc, p) => {
      acc[p.role] = (acc[p.role] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return { departments, roleCounts };
}

/**
 * Get recipients matching the given audience filter
 */
export async function getMessagingRecipients(filter: AudienceFilter) {
  await requireAdmin();
  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select("id, full_name, email, phone_number, role, department, institution")
    .order("full_name");

  switch (filter.type) {
    case "individual":
      if (filter.value) {
        query = query.eq("id", filter.value);
      }
      break;
    case "role":
      if (filter.value) {
        query = query.eq("role", filter.value);
      }
      break;
    case "department":
      if (filter.value) {
        query = query.eq("department", filter.value);
      }
      break;
    case "startup_founders":
      // Get user ids who own startups
      const { data: startups } = await supabase
        .from("startups")
        .select("founder_id");
      const founderIds = [
        ...new Set(startups?.map((s) => s.founder_id).filter(Boolean) ?? []),
      ];
      if (founderIds.length > 0) {
        query = query.in("id", founderIds);
      } else {
        return [];
      }
      break;
    case "everyone":
      // No filter, return all
      break;
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to fetch recipients: ${error.message}`);
  return (data ?? []) as Recipient[];
}

/**
 * Search users by name or email for individual targeting
 */
export async function searchUsers(searchTerm: string) {
  await requireAdmin();
  const supabase = await createClient();

  const term = searchTerm.trim();
  if (term.length < 2) return [];

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone_number, role, department, institution")
    .or(`full_name.ilike.%${term}%,email.ilike.%${term}%`)
    .order("full_name")
    .limit(20);

  return (data ?? []) as Recipient[];
}

/**
 * Log a broadcast and create in-app notifications for recipients
 */
export async function logBroadcast(
  subject: string,
  body: string,
  audienceType: AudienceFilter["type"],
  audienceFilter: Record<string, string>,
  recipientIds: string[],
  channels: string[],
) {
  await requireAdmin();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Insert broadcast record
  await supabase.from("admin_broadcasts").insert({
    admin_id: user.id,
    subject,
    body,
    audience_type: audienceType,
    audience_filter: audienceFilter,
    recipient_count: recipientIds.length,
    channels,
  });

  // Create in-app notification for each recipient
  const notifications = recipientIds.map((userId) => ({
    user_id: userId,
    type: "admin_broadcast" as const,
    title: `📨 ${subject}`,
    message: body.length > 200 ? body.slice(0, 200) + "…" : body,
    is_read: false,
  }));

  if (notifications.length > 0) {
    await supabase.from("notifications").insert(notifications);
  }

  revalidatePath("/admin/messaging");
  return { success: true, recipientCount: recipientIds.length };
}

/**
 * Get broadcast history for admin
 */
export async function getBroadcastHistory(limit: number = 50) {
  await requireAdmin();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("admin_broadcasts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to fetch broadcasts: ${error.message}`);
  return data ?? [];
}
