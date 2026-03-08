"use client";

import { useEffect, useState } from "react";
import { getBroadcastHistory } from "@/app/actions/admin";

interface Broadcast {
  id: string;
  subject: string;
  body: string;
  audience_type: string;
  audience_filter: Record<string, string>;
  recipient_count: number;
  channels: string[];
  created_at: string;
}

const channelIcons: Record<string, string> = {
  email: "📧",
  whatsapp: "💬",
};

const audienceLabels: Record<string, string> = {
  individual: "Individual",
  role: "By Role",
  department: "By Department",
  startup_founders: "Startup Founders",
  everyone: "Everyone",
};

export default function BroadcastHistory() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBroadcastHistory()
      .then(setBroadcasts)
      .catch(() => setBroadcasts([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="mb-4 text-lg font-semibold text-white">
          📋 Broadcast History
        </h3>
        <p className="text-sm text-slate-400">Loading history...</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <h3 className="mb-4 text-lg font-semibold text-white">
        📋 Broadcast History
      </h3>

      {broadcasts.length === 0 ? (
        <p className="text-sm text-slate-400">
          No broadcasts sent yet. Compose your first message above.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-white/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="px-4 py-3 font-medium">Audience</th>
                  <th className="px-4 py-3 font-medium">Recipients</th>
                  <th className="px-4 py-3 font-medium">Channels</th>
                  <th className="px-4 py-3 font-medium">Sent At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {broadcasts.map((b) => (
                  <tr key={b.id} className="hover:bg-white/5">
                    <td className="max-w-[200px] truncate px-4 py-3 text-white">
                      {b.subject}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-300">
                      <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs">
                        {audienceLabels[b.audience_type] || b.audience_type}
                        {b.audience_filter?.value && (
                          <span className="ml-1 text-purple-400">
                            ({b.audience_filter.value})
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-white">
                      {b.recipient_count}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {b.channels.map((ch) => (
                        <span key={ch} className="mr-1" title={ch}>
                          {channelIcons[ch] || ch}
                        </span>
                      ))}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-400">
                      {new Date(b.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
