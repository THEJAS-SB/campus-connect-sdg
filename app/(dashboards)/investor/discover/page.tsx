import { discoverStartups } from "@/app/actions/investor";
import Navbar from "@/components/shared/Navbar";
import StartupCard from "@/components/investor/StartupCard";
import DiscoverFilters from "@/components/investor/DiscoverFilters";
import { Suspense } from "react";

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
        <Suspense
          fallback={
            <div className="mb-6 h-10 animate-pulse rounded-lg bg-white/5" />
          }
        >
          <DiscoverFilters />
        </Suspense>

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
