import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/shared/Sidebar'

const NAV_ITEMS = [
  { href: '/investor', label: 'Dashboard', icon: '🏠' },
  { href: '/investor/discover', label: 'Discover Startups', icon: '🔍' },
  { href: '/investor/pipeline', label: 'My Pipeline', icon: '📋' },
  { href: '/investor/profile', label: 'Profile', icon: '👤' },
]

export default async function InvestorLayout({ children }: { children: React.ReactNode }) {
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

  if (!profile || profile.role !== 'investor') redirect('/sign-in')

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-white">
      <Sidebar
        role={profile.role}
        rsId={profile.rs_id}
        fullName={profile.full_name ?? 'Investor'}
        navItems={NAV_ITEMS}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
