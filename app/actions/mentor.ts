"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type MentorshipStatus = "pending" | "active" | "completed" | "cancelled";
export type MeetingStatus = "pending" | "confirmed" | "completed" | "cancelled";

/**
 * Get all mentor connections (matches)
 */
export async function getMentorConnections() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("matches")
    .select(
      `
      id,
      student_id,
      startup_id,
      compatibility_score,
      reasoning,
      status,
      created_at,
      profiles!matches_student_id_fkey(
        id,
        rs_id,
        full_name,
        bio,
        skills,
        sdgs,
        innovation_score,
        linkedin_url
      ),
      startups(
        id,
        name,
        stage,
        domain
      )
    `,
    )
    .eq("mentor_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch connections: ${error.message}`);

  // Transform Supabase join arrays to single objects
  const transformedData = (data ?? []).map((item: any) => ({
    ...item,
    profiles: Array.isArray(item.profiles)
      ? item.profiles[0] || null
      : item.profiles,
    startups: Array.isArray(item.startups)
      ? item.startups[0] || null
      : item.startups,
  }));

  return transformedData;
}

/**
 * Update mentorship connection status
 */
export async function updateMentorshipStatus(
  matchId: string,
  status: MentorshipStatus,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("matches")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", matchId)
    .eq("mentor_id", user.id);

  if (error) throw new Error(`Failed to update status: ${error.message}`);

  revalidatePath("/mentor");
  revalidatePath("/mentor/mentees");
}

/**
 * Schedule a meeting with a mentee
 */
export async function scheduleMeeting(data: {
  matchId: string;
  menteeId: string;
  title: string;
  description?: string;
  scheduledAt: string;
  durationMinutes?: number;
  meetingLink?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("meetings").insert({
    match_id: data.matchId,
    mentor_id: user.id,
    mentee_id: data.menteeId,
    title: data.title,
    description: data.description || null,
    scheduled_at: data.scheduledAt,
    duration_minutes: data.durationMinutes || 30,
    meeting_link: data.meetingLink || null,
    status: "pending",
  });

  if (error) throw new Error(`Failed to schedule meeting: ${error.message}`);

  revalidatePath("/mentor/meetings");
}

/**
 * Get meetings for mentor
 */
export async function getMentorMeetings() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("meetings")
    .select(
      `
      id,
      title,
      description,
      scheduled_at,
      duration_minutes,
      meeting_link,
      status,
      notes,
      profiles!meetings_mentee_id_fkey(
        full_name,
        rs_id
      )
    `,
    )
    .eq("mentor_id", user.id)
    .order("scheduled_at", { ascending: true });

  if (error) throw new Error(`Failed to fetch meetings: ${error.message}`);

  return data ?? [];
}

/**
 * Update meeting status
 */
export async function updateMeetingStatus(
  meetingId: string,
  status: MeetingStatus,
  notes?: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const updateData: {
    status: MeetingStatus;
    notes?: string;
    updated_at: string;
  } = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (notes) {
    updateData.notes = notes;
  }

  const { error } = await supabase
    .from("meetings")
    .update(updateData)
    .eq("id", meetingId)
    .eq("mentor_id", user.id);

  if (error) throw new Error(`Failed to update meeting: ${error.message}`);

  revalidatePath("/mentor/meetings");
}

/**
 * Get mentor domain statistics
 */
export async function getMentorDomainStats() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Get all active connections and their startup domains
  const { data: matches } = await supabase
    .from("matches")
    .select(
      `
      startups(domain)
    `,
    )
    .eq("mentor_id", user.id)
    .eq("status", "active");

  if (!matches) return [];

  // Count domains
  const domainCounts: Record<string, number> = {};
  matches.forEach((match) => {
    const domain = (match.startups as { domain?: string } | null)?.domain;
    if (domain) {
      domainCounts[domain] = (domainCounts[domain] || 0) + 1;
    }
  });

  return Object.entries(domainCounts).map(([domain, count]) => ({
    domain,
    count,
  }));
}
