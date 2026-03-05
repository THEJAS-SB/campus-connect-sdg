import { createClient } from '@/lib/supabase/server'

export interface MatchResult {
  profile: {
    id: string
    rs_id: string
    full_name: string
    skills: string[]
    sdg_interests: string[]
    bio: string
    role: string
    linkedin_url: string
  }
  similarity: number
}

export async function findSimilarProfiles(
  embedding: number[],
  targetRole: 'mentor' | 'student',
  limit = 5
): Promise<MatchResult[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('match_profiles', {
    query_embedding: embedding,
    target_role: targetRole,
    match_count: limit,
  })

  if (error) throw new Error(`Vector search error: ${error.message}`)

  return (data ?? []) as MatchResult[]
}

export async function findSimilarStartups(
  embedding: number[],
  filters: { stage?: string; domain?: string },
  limit = 10
): Promise<
  Array<{
    id: string
    name: string
    description: string
    stage: string
    domain: string
    sdg_tags: string[]
    funding_raised: number
    student_id: string
    similarity: number
  }>
> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('match_startups', {
    query_embedding: embedding,
    filter_stage: filters.stage ?? null,
    filter_domain: filters.domain ?? null,
    match_count: limit,
  })

  if (error) throw new Error(`Startup vector search error: ${error.message}`)

  return data ?? []
}
