import { discoverStartups } from "@/app/actions/investor";
import Navbar from "@/components/shared/Navbar";
import StartupCard from "@/components/investor/StartupCard";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ stage?: string; domain?: string; sdg?: string }>;
}

export default async function DiscoverPage({ searchParams }: PageProps) {
  const { stage, domain, sdg } = await searchParams;

  let startups: Awaited<ReturnType<typeof discoverStartups>> = [];
  let error: string | null = null;

  try {
    startups = await discoverStartups({
      stage,
      domain,
      sdgs: sdg ? [sdg] : undefined,
    });
  } catch (e) {
    error = (e as Error).message;
  }

  return (
    <div className="min-h-full">
      <Navbar
        title="Discover Startups"
        subtitle="AI-matched to your investment thesis"
      />
      <div className="p-6">
        {/* Filters */}
        <form className="mb-6 flex gap-3 flex-wrap">
          <select
            name="stage"
            defaultValue={stage ?? ""}
            className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
          >
            <option value="">All Stages</option>
            {["idea", "mvp", "revenue", "funded", "scaling"].map((s) => (
              <option key={s} value={s} className="capitalize">
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <select
            name="domain"
            defaultValue={domain ?? ""}
            className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
          >
            <option value="">All Domains</option>
            {[
              "FinTech",
              "EdTech",
              "HealthTech",
              "AgriTech",
              "AI/ML",
              "Web3 / Blockchain",
              "SaaS",
              "GreenTech",
            ].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            name="sdg"
            defaultValue={sdg ?? ""}
            className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
          >
            <option value="">All SDGs</option>
            {[
              "No Poverty",
              "Zero Hunger",
              "Good Health",
              "Quality Education",
              "Gender Equality",
              "Clean Water",
              "Affordable Energy",
              "Decent Work",
              "Industry Innovation",
              "Reduced Inequalities",
              "Sustainable Cities",
              "Responsible Consumption",
              "Climate Action",
              "Life Below Water",
              "Life on Land",
              "Peace and Justice",
              "Partnerships",
            ].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
          >
            Search
          </button>
        </form>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 p-4 text-sm text-red-400 ring-1 ring-red-500/20">
            {error}
          </div>
        )}

        {startups.length === 0 && !error ? (
          <div className="flex flex-col items-center py-16 text-center">
            <p className="text-3xl">🔍</p>
            <p className="mt-2 font-medium text-slate-300">No startups found</p>
            <p className="mt-1 text-sm text-slate-500">
              Try different filters or complete your investor profile for better
              matches.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {startups.map((startup) => (
              <StartupCard key={startup.id} startup={startup} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
