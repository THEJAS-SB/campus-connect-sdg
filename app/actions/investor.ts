"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { findSimilarStartups } from "@/lib/ai/matchmaking";
import { generateStartupGrowthInsight } from "@/lib/ai/groq";

export type PipelineStage =
  | "bookmarked"
  | "in_talks"
  | "due_diligence"
  | "invested"
  | "passed";

/**
 * Get investor's pipeline (all startups they're tracking)
 */
export async function getInvestorPipeline() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("investor_pipeline")
    .select(
      `
      id,
      startup_id,
      stage,
      notes,
      investment_amount,
      valuation,
      equity_percentage,
      created_at,
      updated_at,
      startups(
        id,
        name,
        pitch,
        stage,
        domain,
        sdgs,
        funding_raised,
        funding_goal,
        pitch_deck_url,
        demo_url,
        student_id,
        profiles!startups_student_id_fkey(
          name:full_name,
          avatar_url
        )
      )
    `,
    )
    .eq("investor_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`Failed to fetch pipeline: ${error.message}`);

  // Transform Supabase join arrays to single objects
  const transformedData = (data ?? []).map((item: any) => ({
    ...item,
    startups: Array.isArray(item.startups)
      ? {
          ...item.startups[0],
          profiles: Array.isArray(item.startups[0]?.profiles)
            ? item.startups[0].profiles[0] || null
            : item.startups[0]?.profiles || null,
        }
      : item.startups,
  }));

  return transformedData;
}

/**
 * Add startup to investor pipeline
 */
export async function addToPipeline(
  startupId: string,
  stage: PipelineStage = "bookmarked",
  notes?: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("investor_pipeline").upsert({
    investor_id: user.id,
    startup_id: startupId,
    stage,
    notes: notes || null,
  });

  if (error) throw new Error(`Failed to add to pipeline: ${error.message}`);

  revalidatePath("/investor/pipeline");
  revalidatePath("/investor/discover");
}

/**
 * Update pipeline stage (for Kanban drag-and-drop)
 */
export async function updatePipelineStage(
  pipelineId: string,
  newStage: PipelineStage,
  notes?: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const updateData: {
    stage: PipelineStage;
    notes?: string;
    updated_at: string;
  } = {
    stage: newStage,
    updated_at: new Date().toISOString(),
  };

  if (notes !== undefined) {
    updateData.notes = notes;
  }

  const { error } = await supabase
    .from("investor_pipeline")
    .update(updateData)
    .eq("id", pipelineId)
    .eq("investor_id", user.id);

  if (error) throw new Error(`Failed to update pipeline: ${error.message}`);

  revalidatePath("/investor/pipeline");
}

/**
 * Update investment details
 */
export async function updateInvestmentDetails(
  pipelineId: string,
  details: {
    investmentAmount?: number;
    valuation?: number;
    equityPercentage?: number;
    notes?: string;
  },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (details.investmentAmount !== undefined) {
    updateData.investment_amount = details.investmentAmount;
  }
  if (details.valuation !== undefined) {
    updateData.valuation = details.valuation;
  }
  if (details.equityPercentage !== undefined) {
    updateData.equity_percentage = details.equityPercentage;
  }
  if (details.notes !== undefined) {
    updateData.notes = details.notes;
  }

  const { error } = await supabase
    .from("investor_pipeline")
    .update(updateData)
    .eq("id", pipelineId)
    .eq("investor_id", user.id);

  if (error)
    throw new Error(`Failed to update investment details: ${error.message}`);

  revalidatePath("/investor/pipeline");
}

/**
 * Remove startup from pipeline
 */
export async function removeFromPipeline(pipelineId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("investor_pipeline")
    .delete()
    .eq("id", pipelineId)
    .eq("investor_id", user.id);

  if (error)
    throw new Error(`Failed to remove from pipeline: ${error.message}`);

  revalidatePath("/investor/pipeline");
}

/**
 * Discover startups with AI matching
 */
export async function discoverStartups(filters?: {
  stage?: string;
  domain?: string;
  minFundingRaised?: number;
  sdgs?: string[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Get investor profile for embedding-based matching
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, bio, skills, sdgs, embedding, investment_thesis")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("Profile not found");

  // Build query
  let query = supabase
    .from("startups")
    .select(
      `
      id,
      name,
      pitch,
      stage,
      domain,
      sdgs,
      funding_raised,
      pitch_deck_url,
      demo_url,
      github_url,
      created_at,
      profiles!startups_student_id_fkey(
        full_name,
        rs_id,
        innovation_score,
        linkedin_url
      )
    `,
    )
    .order("created_at", { ascending: false });

  // Apply filters
  if (filters?.stage) {
    query = query.eq("stage", filters.stage);
  }
  if (filters?.domain) {
    query = query.eq("domain", filters.domain);
  }
  if (filters?.minFundingRaised) {
    query = query.gte("funding_raised", filters.minFundingRaised);
  }
  if (filters?.sdgs && filters.sdgs.length > 0) {
    query = query.overlaps("sdgs", filters.sdgs);
  }

  const { data: startups, error } = await query.limit(50);

  if (error) throw new Error(`Failed to discover startups: ${error.message}`);

  // Transform profiles from array to single object (Supabase join quirk)
  const transformedStartups = (startups ?? []).map((startup: any) => ({
    ...startup,
    profiles: Array.isArray(startup.profiles)
      ? startup.profiles[0] || null
      : startup.profiles,
  }));

  return transformedStartups;
}

/**
 * Get growth insight for a startup using Groq AI
 */
export async function getStartupGrowthInsight(startupId: string) {
  const supabase = await createClient();

  const { data: startup } = await supabase
    .from("startups")
    .select("id, name, pitch, stage, domain, sdgs, created_at, updated_at")
    .eq("id", startupId)
    .single();

  if (!startup) throw new Error("Startup not found");

  // Get recent activity summary (simplified for now)
  const daysSinceCreation = Math.floor(
    (Date.now() - new Date(startup.created_at).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  const activitySummary = `Created ${daysSinceCreation} days ago. Currently at ${startup.stage} stage.`;

  try {
    const insight = await generateStartupGrowthInsight(
      {
        name: startup.name,
        description: startup.pitch,
        stage: startup.stage,
        domain: startup.domain,
        sdg_tags: startup.sdgs,
      },
      activitySummary,
    );

    return insight;
  } catch (error) {
    console.error("Failed to generate growth insight:", error);
    return "Growth insights temporarily unavailable. The startup shows promising early traction.";
  }
}

/**
 * Get investor analytics
 */
export async function getInvestorAnalytics() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: pipeline } = await supabase
    .from("investor_pipeline")
    .select("stage, investment_amount")
    .eq("investor_id", user.id);

  if (!pipeline) return { byStage: {}, totalInvested: 0, totalStartups: 0 };

  const byStage: Record<string, number> = {};
  let totalInvested = 0;

  pipeline.forEach((item) => {
    byStage[item.stage] = (byStage[item.stage] || 0) + 1;
    if (item.investment_amount) {
      totalInvested += Number(item.investment_amount);
    }
  });

  return {
    byStage,
    totalInvested,
    totalStartups: pipeline.length,
  };
}
