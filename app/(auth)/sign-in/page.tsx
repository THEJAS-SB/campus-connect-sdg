import Link from 'next/link'
import { signIn } from '@/app/actions/auth'

interface PageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function SignInPage({ searchParams }: PageProps) {
  const { error } = await searchParams

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-sm">
      {/* Logo / Brand */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">INNOVEX</h1>
        <p className="mt-1 text-sm text-slate-400">Campus Innovation OS</p>
      </div>

      <h2 className="mb-6 text-xl font-semibold text-white">Welcome back</h2>

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
          {decodeURIComponent(error)}
        </div>
      )}

      <form action={signIn} className="space-y-4">
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
            placeholder="••••••••"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <button
          type="submit"
          className="mt-2 w-full rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          Sign In
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Don&apos;t have an account?{' '}
        <Link href="/sign-up" className="font-medium text-purple-400 hover:text-purple-300">
          Sign up
        </Link>
      </p>
    </div>
  )
}
