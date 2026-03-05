'use server'

import { revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { generateEmbedding, buildStartupEmbeddingText } from '@/lib/ai/embeddings'
import { findSimilarStartups } from '@/lib/ai/matchmaking'
import { generateStartupGrowthInsight } from '@/lib/ai/groq'

export async function getRecommendedStartups(filters: { stage?: string; domain?: string }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('bio, skills, sdg_interests')
    .eq('id', user.id)
    .single()

  const thesisText = [
    profile?.bio ?? '',
    profile?.skills?.join(', ') ?? '',
    profile?.sdg_interests?.join(', ') ?? '',
    filters.domain ?? '',
  ]
    .filter(Boolean)
    .join('. ')

  const embedding = await generateEmbedding(thesisText)
  const startups = await findSimilarStartups(embedding, filters, 10)

  // Generate growth insights for top 5
  const withInsights = await Promise.all(
    startups.slice(0, 5).map(async (s) => {
      const insight = await generateStartupGrowthInsight(
        {
          name: s.name,
          description: s.description,
          stage: s.stage,
          domain: s.domain,
          sdg_tags: s.sdg_tags,
        },
        `Startup at ${s.stage} stage.`
      )
      return { ...s, growth_insight: insight }
    })
  )

  return [...withInsights, ...startups.slice(5).map((s) => ({ ...s, growth_insight: null }))]
}

export async function updatePipelineStage(
  startupId: string,
  newStage: 'bookmarked' | 'in_talks' | 'due_diligence' | 'invested'
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await supabase.from('investor_pipeline').upsert({
    investor_id: user.id,
    startup_id: startupId,
    pipeline_stage: newStage,
  })

  revalidateTag('investor-pipeline')
}

export async function getInvestorPipeline() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data } = await supabase
    .from('investor_pipeline')
    .select('*, startups(id, name, description, stage, domain, sdg_tags, funding_raised)')
    .eq('investor_id', user.id)

  return data ?? []
}
