import { getMentorConnections } from "@/app/actions/mentor";
import Navbar from "@/components/shared/Navbar";
import MenteeConnectionCard from "@/components/mentor/MenteeConnectionCard";

export const dynamic = "force-dynamic";

export default async function MenteesPage() {
  const connections = await getMentorConnections();

  const active = connections.filter((c) => c.status === "active");
  const pending = connections.filter((c) => c.status === "pending");
  const completed = connections.filter((c) => c.status === "completed");

  return (
    <div className="min-h-full">
      <Navbar
        title="My Mentees"
        subtitle="Manage your mentorship connections"
      />
      <div className="p-6">
        {/* Stats Summary */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
            <p className="text-2xl font-bold text-white">{active.length}</p>
            <p className="text-xs text-slate-400">Active Connections</p>
          </div>
          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
            <p className="text-2xl font-bold text-white">{pending.length}</p>
            <p className="text-xs text-slate-400">Pending Requests</p>
          </div>
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <p className="text-2xl font-bold text-white">{completed.length}</p>
            <p className="text-xs text-slate-400">Completed</p>
          </div>
        </div>

        {connections.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <p className="text-3xl">🎓</p>
            <p className="mt-2 font-medium text-slate-300">No mentees yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Browse suggested mentees to start building your mentorship
              network.
            </p>
            <a
              href="/mentor/suggested"
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Find Mentees
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pending Requests */}
            {pending.length > 0 && (
              <section>
                <h2 className="mb-3 text-lg font-semibold text-white">
                  Pending Requests ({pending.length})
                </h2>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {pending.map((connection) => (
                    <MenteeConnectionCard
                      key={connection.id}
                      connection={connection}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Active Mentees */}
            {active.length > 0 && (
              <section>
                <h2 className="mb-3 text-lg font-semibold text-white">
                  Active Mentees ({active.length})
                </h2>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {active.map((connection) => (
                    <MenteeConnectionCard
                      key={connection.id}
                      connection={connection}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Completed */}
            {completed.length > 0 && (
              <section>
                <h2 className="mb-3 text-lg font-semibold text-slate-400">
                  Completed ({completed.length})
                </h2>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {completed.map((connection) => (
                    <MenteeConnectionCard
                      key={connection.id}
                      connection={connection}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
