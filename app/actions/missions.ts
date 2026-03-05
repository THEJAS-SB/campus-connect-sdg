"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateDailyMissions } from "@/lib/ai/missions";
import { checkAndAwardBadges } from "@/lib/gamification/badges";

export async function fetchOrGenerateMissions() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Check if missions already exist for today (not expired)
  const { data: existing } = await supabase
    .from("missions")
    .select("*")
    .eq("student_id", user.id)
    .gte("expires_at", today.toISOString())
    .lt("created_at", tomorrow.toISOString());

  if (existing && existing.length > 0) return existing;

  // Fetch profile + startup for context
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, skills, interests, innovation_score")
    .eq("id", user.id)
    .single();

  const { data: startup } = await supabase
    .from("startups")
    .select("name, stage")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const missions = await generateDailyMissions({
    studentName: profile?.full_name ?? "Student",
    startupStage: startup?.stage ?? "idea",
    startupName: startup?.name,
    skills: profile?.skills ?? [],
    interests: profile?.interests ?? [],
    innovationScore: profile?.innovation_score ?? 0,
  });

  // Set expiration to midnight tomorrow
  const expiresAt = new Date(tomorrow);

  const { data: inserted } = await supabase
    .from("missions")
    .insert(
      missions.map((m) => ({
        ...m,
        student_id: user.id,
        expires_at: expiresAt.toISOString(),
      })),
    )
    .select();

  revalidatePath('/student/missions');
  return inserted ?? [];
}

/**
 * Complete a mission and award XP
 */
export async function completeMission(missionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Get mission details
  const { data: mission } = await supabase
    .from("missions")
    .select("*")
    .eq("id", missionId)
    .eq("student_id", user.id)
    .single();

  if (!mission) throw new Error("Mission not found");
  if (mission.is_completed) throw new Error("Mission already completed");

  // Mark as completed
  await supabase
    .from("missions")
    .update({ is_completed: true, completed_at: new Date().toISOString() })
    .eq("id", missionId);

  // Award XP to innovation score
  const { data: profile } = await supabase
    .from("profiles")
    .select("innovation_score")
    .eq("id", user.id)
    .single();

  const newScore = (profile?.innovation_score ?? 0) + mission.xp_reward;

  await supabase
    .from("profiles")
    .update({ innovation_score: newScore })
    .eq("id", user.id);

  // Log activity
  await supabase.from("activity_log").insert({
    user_id: user.id,
    activity_type: "mission_completed",
    metadata: { mission_id: missionId, xp_reward: mission.xp_reward },
  });

  // Check for newly earned badges
  await checkAndAwardBadges(user.id);

  revalidatePath('/student/missions');
  revalidatePath('/student');
  
  return { xp_awarded: mission.xp_reward, new_score: newScore };
}
