import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/shared/Sidebar'

const NAV_ITEMS = [
  { href: '/mentor', label: 'Dashboard', icon: '🏠' },
  { href: '/mentor/suggested', label: 'Suggested Mentees', icon: '🎯' },
  { href: '/mentor/mentees', label: 'My Mentees', icon: '👥' },
  { href: '/mentor/meetings', label: 'Meetings', icon: '📅' },
  { href: '/mentor/analytics', label: 'Analytics', icon: '📊' },
  { href: '/mentor/profile', label: 'Profile', icon: '👤' },
]

export default async function MentorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/sign-in')

  const { data: profile } = await supabase
    .from('profiles')
    .select('rs_id, full_name, role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'mentor') redirect('/sign-in')

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-white">
      <Sidebar
        role={profile.role}
        rsId={profile.rs_id}
        fullName={profile.full_name ?? 'Mentor'}
        navItems={NAV_ITEMS}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
