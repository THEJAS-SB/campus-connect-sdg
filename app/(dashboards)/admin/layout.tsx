import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/shared/Sidebar'

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: '🏠' },
  { href: '/admin/overview', label: 'Overview', icon: '📈' },
  { href: '/admin/ecosystem', label: 'Ecosystem', icon: '🌐' },
  { href: '/admin/insights', label: 'AI Insights', icon: '🤖' },
  { href: '/admin/activity', label: 'Activity', icon: '📊' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/messaging', label: 'Messaging', icon: '📨' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
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

  if (!profile || profile.role !== 'admin') redirect('/sign-in')

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-white">
      <Sidebar
        role={profile.role}
        rsId={profile.rs_id}
        fullName={profile.full_name ?? 'Admin'}
        navItems={NAV_ITEMS}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
