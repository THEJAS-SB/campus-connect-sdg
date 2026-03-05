'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/actions/auth'

interface NavItem {
  href: string
  label: string
  icon: string
}

interface SidebarProps {
  role: string
  rsId: string
  fullName: string
  navItems: NavItem[]
}

export default function Sidebar({ role, rsId, fullName, navItems }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-white/10 bg-slate-900/80 backdrop-blur-sm">
      {/* Brand */}
      <div className="border-b border-white/10 px-6 py-5">
        <h1 className="text-xl font-bold text-white">INNOVEX</h1>
        <p className="text-xs text-slate-400">Campus Innovation OS</p>
      </div>

      {/* User Badge */}
      <div className="border-b border-white/10 px-6 py-4">
        <p className="truncate text-sm font-semibold text-white">{fullName}</p>
        <p className="mt-0.5 text-xs font-mono text-purple-400">{rsId}</p>
        <span className="mt-1.5 inline-block rounded-full bg-purple-500/20 px-2.5 py-0.5 text-xs font-medium capitalize text-purple-300">
          {role}
        </span>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-purple-600/20 text-purple-300'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Sign Out */}
      <div className="border-t border-white/10 px-3 py-4">
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            <span className="text-base">🚪</span>
            Sign Out
          </button>
        </form>
      </div>
    </aside>
  )
}
