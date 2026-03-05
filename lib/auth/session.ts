/**
 * Authentication and authorization utilities for Server Actions
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Get current authenticated user or throw error
 */
export async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized - Please sign in')
  }

  return user
}

/**
 * Get current user profile with role or throw error
 */
export async function requireProfile(allowedRoles?: string[]) {
  const supabase = await createClient()
  const user = await requireUser()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    throw new Error('Profile not found')
  }

  // Check role if specified
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    throw new Error(`Access denied. Required role: ${allowedRoles.join(' or ')}`)
  }

  return profile
}

/**
 * Require admin role
 */
export async function requireAdmin() {
  return await requireProfile(['admin'])
}

/**
 * Require mentor role
 */
export async function requireMentor() {
  return await requireProfile(['mentor'])
}

/**
 * Require investor role
 */
export async function requireInvestor() {
  return await requireProfile(['investor'])
}

/**
 * Require student role
 */
export async function requireStudent() {
  return await requireProfile(['student'])
}

/**
 * Check if user owns a resource
 */
export async function requireOwnership(
  resourceUserId: string,
  errorMessage = 'You do not have permission to modify this resource'
) {
  const user = await requireUser()
  if (user.id !== resourceUserId) {
    throw new Error(errorMessage)
  }
  return user
}

/**
 * Safe redirect wrapper for Server Actions/Components
 */
export function safeRedirect(path: string): never {
  redirect(path)
}
