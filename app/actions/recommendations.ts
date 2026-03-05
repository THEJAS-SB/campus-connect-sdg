"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateEmbedding } from "@/lib/ai/embeddings";
import { findSimilarStartups } from "@/lib/ai/matchmaking";
import { generateStartupGrowthInsight } from "@/lib/ai/groq";

export async function getRecommendedStartups(filters: {
  stage?: string;
  domain?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("bio, skills, sdgs")
    .eq("id", user.id)
    .single();

  const thesisText = [
    profile?.bio ?? "",
    profile?.skills?.join(", ") ?? "",
    (profile?.sdgs as string[] | null)?.join(", ") ?? "",
    filters.domain ?? "",
  ]
    .filter(Boolean)
    .join(". ");

  const embedding = await generateEmbedding(thesisText);
  if (!embedding)
    throw new Error(
      "Could not generate embedding – ensure HUGGING_FACE_API_KEY is set.",
    );

  const startups = await findSimilarStartups(embedding, filters, 10);

  // Generate growth insights for top 5
  const withInsights = await Promise.all(
    startups.slice(0, 5).map(async (s) => {
      try {
        const insight = await generateStartupGrowthInsight(
          {
            name: s.name,
            description: s.description,
            stage: s.stage,
            domain: s.domain,
            sdg_tags: s.sdg_tags,
          },
          `Startup at ${s.stage ?? "idea"} stage.`,
        );
        return { ...s, growth_insight: insight };
      } catch {
        return { ...s, growth_insight: null };
      }
    }),
  );

  return [
    ...withInsights,
    ...startups.slice(5).map((s) => ({ ...s, growth_insight: null })),
  ];
}

export async function updatePipelineStage(
  startupId: string,
  newStage: "bookmarked" | "in_talks" | "due_diligence" | "invested",
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await supabase.from("investor_pipeline").upsert({
    investor_id: user.id,
    startup_id: startupId,
    pipeline_stage: newStage,
  });

  revalidatePath("/investor");
  revalidatePath("/investor/discover");
}

export async function getInvestorPipeline() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data } = await supabase
    .from("investor_pipeline")
    .select(
      "*, startups(id, name, description, stage, domain, sdg_tags, funding_raised)",
    )
    .eq("investor_id", user.id);

  return data ?? [];
}
