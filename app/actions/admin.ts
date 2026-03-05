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

  revalidatePath("/admin");
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
      activity_type,
      metadata,
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
