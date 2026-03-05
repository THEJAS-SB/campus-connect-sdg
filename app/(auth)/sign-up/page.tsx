import Link from 'next/link'
import { signUp } from '@/app/actions/auth'

interface PageProps {
  searchParams: Promise<{ error?: string }>
}

const ROLES = [
  {
    value: 'student',
    label: 'Student',
    description: 'Build startups, earn XP, find mentors',
    icon: '🎓',
  },
  {
    value: 'mentor',
    label: 'Mentor',
    description: 'Guide the next generation of founders',
    icon: '🧑‍🏫',
  },
  {
    value: 'investor',
    label: 'Investor',
    description: 'Discover vetted campus startups',
    icon: '💼',
  },
  {
    value: 'admin',
    label: 'Admin',
    description: 'Manage and analyse the ecosystem',
    icon: '🏛️',
  },
]

export default async function SignUpPage({ searchParams }: PageProps) {
  const { error } = await searchParams

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-sm">
      {/* Logo / Brand */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">INNOVEX</h1>
        <p className="mt-1 text-sm text-slate-400">Campus Innovation OS</p>
      </div>

      <h2 className="mb-6 text-xl font-semibold text-white">Create your account</h2>

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
          {decodeURIComponent(error)}
        </div>
      )}

      <form action={signUp} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300" htmlFor="full_name">
            Full Name
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            placeholder="Your full name"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300" htmlFor="email">
            Institutional Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@university.edu"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="Min. 8 characters"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        {/* Role Selection */}
        <div>
          <p className="mb-2 text-sm font-medium text-slate-300">I am a…</p>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((role) => (
              <label
                key={role.value}
                className="relative flex cursor-pointer flex-col gap-1 rounded-lg border border-white/10 bg-white/5 p-3 transition hover:border-purple-500/50 has-[:checked]:border-purple-500 has-[:checked]:bg-purple-500/10"
              >
                <input
                  type="radio"
                  name="role"
                  value={role.value}
                  defaultChecked={role.value === 'student'}
                  className="absolute opacity-0"
                />
                <span className="text-lg">{role.icon}</span>
                <span className="text-sm font-semibold text-white">{role.label}</span>
                <span className="text-xs text-slate-400 leading-tight">{role.description}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="mt-2 w-full rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          Create Account &amp; Get RS ID
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Already have an account?{' '}
        <Link href="/sign-in" className="font-medium text-purple-400 hover:text-purple-300">
          Sign in
        </Link>
      </p>
    </div>
  )
}
