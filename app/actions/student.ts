"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateStartupEmbedding } from "@/lib/ai/embeddings";

export type StartupStage = "idea" | "mvp" | "revenue" | "funded" | "scaling";

const STAGE_SCORE_DELTA: Record<StartupStage, number> = {
  idea: 0,
  mvp: 100,
  revenue: 200,
  funded: 400,
  scaling: 600,
};

export async function updateStartupStage(
  startupId: string,
  newStage: StartupStage,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: startup } = await supabase
    .from("startups")
    .select("*")
    .eq("id", startupId)
    .eq("student_id", user.id)
    .single();

  if (!startup) throw new Error("Startup not found");

  await supabase
    .from("startups")
    .update({ stage: newStage, updated_at: new Date().toISOString() })
    .eq("id", startupId);

  // Update innovation score based on stage progression
  const oldScore = STAGE_SCORE_DELTA[startup.stage as StartupStage] ?? 0;
  const newScore = STAGE_SCORE_DELTA[newStage];
  const delta = newScore - oldScore;

  if (delta > 0) {
    await supabase.rpc("increment_innovation_score", {
      p_user_id: user.id,
      p_delta: delta,
    });
  }

  revalidatePath("/student");
  revalidatePath("/student/startup");
}

export async function upsertStartup(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const domain = formData.get("domain") as string;
  const sdgTagsRaw = formData.get("sdg_tags") as string;
  const sdg_tags = sdgTagsRaw
    ? sdgTagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];
  const startupId = formData.get("startup_id") as string | null;

  // Generate embedding for matchmaking
  let embedding: number[] | null = null;
  try {
    embedding = await generateStartupEmbedding({
      name,
      description,
      domain,
      stage: "idea",
      sdg_tags,
    });
  } catch (error) {
    console.error("Embedding generation failed:", error);
    // embedding generation is non-critical; proceed without it
  }

  if (startupId) {
    await supabase
      .from("startups")
      .update({
        name,
        description,
        domain,
        sdg_tags,
        embedding,
        updated_at: new Date().toISOString(),
      })
      .eq("id", startupId)
      .eq("student_id", user.id);
  } else {
    await supabase.from("startups").insert({
      student_id: user.id,
      name,
      description,
      domain,
      sdg_tags,
      stage: "idea",
      embedding,
    });
    // First startup = 50 XP
    await supabase.rpc("increment_innovation_score", {
      p_user_id: user.id,
      p_delta: 50,
    });
  }

  revalidatePath("/student");
  revalidatePath("/student/startup");
}

export async function completeMission(missionId: string, xpReward: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await supabase
    .from("missions")
    .update({ is_completed: true })
    .eq("id", missionId)
    .eq("student_id", user.id);

  await supabase.rpc("increment_innovation_score", {
    p_user_id: user.id,
    p_delta: xpReward,
  });

  // Update streak
  await supabase.rpc("update_streak", { p_user_id: user.id });

  revalidatePath("/student");
  revalidatePath("/student/startup");
}
