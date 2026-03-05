'use server'

import { checkAndAwardBadges, getAllBadges, getUserBadges, getBadgeProgress } from '@/lib/gamification/badges'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Get user's badges and progress
 */
export async function getMyBadges() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const [userBadges, allBadges, progress] = await Promise.all([
    getUserBadges(user.id),
    getAllBadges(),
    getBadgeProgress(user.id),
  ])

  return {
    earned: userBadges,
    all: allBadges,
    progress,
  }
}

/**
 * Check and award any new badges to current user
 */
export async function checkMyBadges() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const newlyEarned = await checkAndAwardBadges(user.id)

  if (newlyEarned.length > 0) {
    revalidatePath('/student/profile')
  }

  return newlyEarned
}
