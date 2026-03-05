import { ProfileSkeleton } from "@/components/shared/LoadingSkeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-purple-950 p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="space-y-2">
          <div className="h-10 w-48 animate-pulse rounded-lg bg-white/5" />
          <div className="h-6 w-96 animate-pulse rounded-lg bg-white/5" />
        </div>
        <ProfileSkeleton />
      </div>
    </div>
  );
}
