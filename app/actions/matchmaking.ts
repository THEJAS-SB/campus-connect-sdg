'use server'

import { revalidateTag } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { generateEmbedding, buildEmbeddingText } from '@/lib/ai/embeddings'
import { findSimilarProfiles } from '@/lib/ai/matchmaking'
import { generateMatchReasoning } from '@/lib/ai/groq'

export async function getStudentMentorMatches() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, skills, sdg_interests, bio, embedding')
    .eq('id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  let embedding: number[] = profile.embedding
  if (!embedding) {
    embedding = await generateEmbedding(buildEmbeddingText(profile))
    await supabase.from('profiles').update({ embedding }).eq('id', user.id)
  }

  const matches = await findSimilarProfiles(embedding, 'mentor', 5)

  // Generate reasoning for each match using Groq
  const results = await Promise.all(
    matches.map(async (match) => {
      const reasoning = await generateMatchReasoning(
        {
          full_name: match.profile.full_name,
          skills: match.profile.skills,
          sdg_interests: match.profile.sdg_interests,
          bio: match.profile.bio,
        },
        {
          full_name: profile.full_name,
          skills: profile.skills,
          sdg_interests: profile.sdg_interests,
          bio: profile.bio,
        },
        match.similarity
      )
      return { ...match, reasoning }
    })
  )

  return results
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
    .select('full_name, skills, sdg_interests, bio, embedding')
    .eq('id', user.id)
    .single()

  if (!profile) throw new Error('Profile not found')

  let embedding: number[] = profile.embedding
  if (!embedding) {
    embedding = await generateEmbedding(buildEmbeddingText(profile))
    await supabase.from('profiles').update({ embedding }).eq('id', user.id)
  }

  const matches = await findSimilarProfiles(embedding, 'student', 10)

  const results = await Promise.all(
    matches.map(async (match) => {
      const reasoning = await generateMatchReasoning(
        {
          full_name: profile.full_name,
          skills: profile.skills,
          sdg_interests: profile.sdg_interests,
          bio: profile.bio,
        },
        {
          full_name: match.profile.full_name,
          skills: match.profile.skills,
          sdg_interests: match.profile.sdg_interests,
          bio: match.profile.bio,
        },
        match.similarity
      )
      return { ...match, reasoning }
    })
  )

  return results
}
