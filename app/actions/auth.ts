'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type Role = 'student' | 'mentor' | 'investor' | 'admin'

const ROLE_ROUTES: Record<Role, string> = {
  student: '/student',
  mentor: '/mentor',
  investor: '/investor',
  admin: '/admin',
}

function generateRsId(role: Role): string {
  const prefix = role.toUpperCase().slice(0, 2)
  const year = new Date().getFullYear()
  const random = Math.floor(100000 + Math.random() * 900000)
  return `${prefix}-${year}-${random}`
}

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string
  const role = (formData.get('role') as Role) ?? 'student'

  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error || !data.user) {
    redirect(`/sign-up?error=${encodeURIComponent(error?.message ?? 'Sign up failed')}`)
  }

  const rsId = generateRsId(role)

  const { error: profileError } = await supabase.from('profiles').insert({
    id: data.user.id,
    rs_id: rsId,
    full_name: fullName,
    email,
    role,
    avatar_state: 'idle',
    innovation_score: 0,
    streak_count: 0,
  })

  if (profileError) {
    redirect(`/sign-up?error=${encodeURIComponent(profileError.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect(ROLE_ROUTES[role])
}

export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect(`/sign-in?error=${encodeURIComponent(error.message)}`)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/sign-in')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (profile?.role as Role) ?? 'student'

  revalidatePath('/', 'layout')
  redirect(ROLE_ROUTES[role])
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/sign-in')
}
