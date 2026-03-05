'use server'

import { revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { generateProfileEmbedding } from '@/lib/ai/embeddings'
import { findMentorsForStudent, findSimilarProfiles } from '@/lib/ai/matchmaking'
import { generateMatchReasoning } from '@/lib/ai/groq'
import { requireRateLimit, RATE_LIMITS } from '@/lib/utils/rate-limit'

export async function getStudentMentorMatches() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Rate limit AI-powered matchmaking
  await requireRateLimit(user.id, RATE_LIMITS.AI_GROQ_MATCHMAKING)

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, skills, sdgs, bio, role, embedding')
    .eq('id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  let embedding: number[] | null = profile.embedding
  if (!embedding) {
    embedding = await generateProfileEmbedding({
      full_name: profile.full_name,
      bio: profile.bio,
      skills: profile.skills,
      sdgs: profile.sdgs,
      role: profile.role,
    })
    if (embedding) {
      await supabase.from('profiles').update({ embedding }).eq('id', user.id)
    } else {
      throw new Error('Could not generate embedding – fill in your profile first.')
    }
  }

  try {
    return await findMentorsForStudent(user.id, 5)
  } catch {
    return []
  }
}

export async function connectWithMentor(mentorId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  await supabase.from('mentorship_connections').upsert({
    mentor_id: mentorId,
    student_id: user.id,
    status: 'pending',
  })

  revalidateTag('connections')
}

export async function getMenteeSuggestions() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, skills, sdgs, bio, role, embedding')
    .eq('id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  let embedding: number[] | null = profile.embedding
  if (!embedding) {
    embedding = await generateProfileEmbedding({
      full_name: profile.full_name,
      bio: profile.bio,
      skills: profile.skills,
      sdgs: profile.sdgs,
      role: profile.role,
    })
    if (embedding) {
      await supabase.from('profiles').update({ embedding }).eq('id', user.id)
    } else {
      throw new Error('Could not generate embedding for profile.')
    }
  }

  const matches = await findSimilarProfiles(embedding, 'student', 10)

  return Promise.all(
    matches.map(async (match) => {
      try {
        const reasoning = await generateMatchReasoning(
          {
            full_name: profile.full_name,
            skills: profile.skills,
            sdgs: profile.sdgs,
            bio: profile.bio,
          },
          {
            full_name: match.profile.full_name,
            skills: match.profile.skills,
            sdgs: match.profile.sdgs,
            bio: match.profile.bio,
          },
          match.similarity
        )
        return { ...match, reasoning }
      } catch {
        return {
          ...match,
          reasoning: `${Math.round(match.similarity * 100)}% match based on shared interests.`,
        }
      }
    })
  )
}
