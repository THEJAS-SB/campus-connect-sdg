import { upsertStartup } from '@/app/actions/student'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/shared/Navbar'
import StartupStepper from '@/components/student/StartupStepper'

export const dynamic = 'force-dynamic'

const SDG_OPTIONS = [
  'SDG 1: No Poverty', 'SDG 2: Zero Hunger', 'SDG 3: Good Health',
  'SDG 4: Quality Education', 'SDG 5: Gender Equality', 'SDG 6: Clean Water',
  'SDG 7: Clean Energy', 'SDG 8: Decent Work', 'SDG 9: Industry & Innovation',
  'SDG 10: Reduced Inequalities', 'SDG 11: Sustainable Cities', 'SDG 13: Climate Action',
]

const DOMAIN_OPTIONS = [
  'FinTech', 'EdTech', 'HealthTech', 'AgriTech', 'GreenTech', 'AI/ML',
  'Web3 / Blockchain', 'SaaS', 'E-Commerce', 'CleanTech', 'BioTech', 'Other',
]

export default async function StartupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: startup } = await supabase
    .from('startups')
    .select('*')
    .eq('student_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <div className="min-h-full">
      <Navbar title="My Startup" subtitle="Manage your innovation project" />
      <div className="p-6">
        {startup && (
          <div className="mb-6">
            <StartupStepper
              startupId={startup.id}
              currentStage={startup.stage}
              startupName={startup.name}
            />
          </div>
        )}

        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <h3 className="mb-5 text-base font-semibold text-white">
            {startup ? 'Update Startup Details' : 'Register Your Startup'}
          </h3>

          <form action={upsertStartup} className="space-y-4">
            {startup && <input type="hidden" name="startup_id" value={startup.id} />}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Startup Name</label>
              <input
                name="name"
                required
                defaultValue={startup?.name ?? ''}
                placeholder="e.g. EduBridge"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Description</label>
              <textarea
                name="description"
                rows={3}
                defaultValue={startup?.description ?? ''}
                placeholder="What problem do you solve? Who is your target user?"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Domain</label>
              <select
                name="domain"
                defaultValue={startup?.domain ?? ''}
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-2.5 text-sm text-white focus:border-sky-500 focus:outline-none"
              >
                <option value="">Select domain…</option>
                {DOMAIN_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">
                SDG Tags <span className="text-slate-500">(comma-separated)</span>
              </label>
              <input
                name="sdg_tags"
                defaultValue={startup?.sdg_tags?.join(', ') ?? ''}
                placeholder="SDG 4: Quality Education, SDG 9: Industry & Innovation"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400"
            >
              {startup ? 'Save Changes' : 'Register Startup'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
