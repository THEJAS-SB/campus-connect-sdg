"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getMessagingRecipients,
  searchUsers,
  type AudienceFilter,
  type Recipient,
} from "@/app/actions/admin";

interface AudienceSelectorProps {
  departments: string[];
  roleCounts: Record<string, number>;
  onRecipientsChange: (recipients: Recipient[], filter: AudienceFilter) => void;
}

const AUDIENCE_OPTIONS = [
  { value: "individual", label: "Individual User", icon: "👤" },
  { value: "role:student", label: "All Students", icon: "🎓" },
  { value: "role:mentor", label: "All Mentors", icon: "🧑‍🏫" },
  { value: "role:investor", label: "All Investors", icon: "💼" },
  { value: "department", label: "By Department", icon: "🏛️" },
  { value: "startup_founders", label: "All Startup Founders", icon: "🚀" },
  { value: "everyone", label: "Everyone", icon: "🌍" },
] as const;

export default function AudienceSelector({
  departments,
  roleCounts,
  onRecipientsChange,
}: AudienceSelectorProps) {
  const [audienceType, setAudienceType] = useState("");
  const [department, setDepartment] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Recipient[]>([]);
  const [selectedUser, setSelectedUser] = useState<Recipient | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRecipients = useCallback(
    async (filter: AudienceFilter) => {
      setLoading(true);
      try {
        const data = await getMessagingRecipients(filter);
        setRecipients(data);
        onRecipientsChange(data, filter);
      } catch {
        setRecipients([]);
        onRecipientsChange([], filter);
      } finally {
        setLoading(false);
      }
    },
    [onRecipientsChange],
  );

  // Handle audience type change
  useEffect(() => {
    if (!audienceType) {
      setRecipients([]);
      return;
    }

    if (audienceType.startsWith("role:")) {
      const role = audienceType.split(":")[1];
      fetchRecipients({ type: "role", value: role });
    } else if (audienceType === "startup_founders") {
      fetchRecipients({ type: "startup_founders" });
    } else if (audienceType === "everyone") {
      fetchRecipients({ type: "everyone" });
    }
    // individual and department need additional selection
  }, [audienceType, fetchRecipients]);

  // Handle department change
  useEffect(() => {
    if (audienceType === "department" && department) {
      fetchRecipients({ type: "department", value: department });
    }
  }, [audienceType, department, fetchRecipients]);

  // Handle user search
  useEffect(() => {
    if (audienceType !== "individual" || searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await searchUsers(searchTerm);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, audienceType]);

  const selectUser = (user: Recipient) => {
    setSelectedUser(user);
    setRecipients([user]);
    setSearchResults([]);
    setSearchTerm("");
    onRecipientsChange([user], { type: "individual", value: user.id });
  };

  const clearSelection = () => {
    setSelectedUser(null);
    setRecipients([]);
    setSearchTerm("");
    onRecipientsChange([], { type: "individual" });
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <h3 className="mb-4 text-lg font-semibold text-white">
        🎯 Select Audience
      </h3>

      {/* Audience Type Selector */}
      <div className="mb-4">
        <label className="mb-2 block text-sm text-slate-400">
          Target Audience
        </label>
        <select
          value={audienceType}
          onChange={(e) => {
            setAudienceType(e.target.value);
            setDepartment("");
            setSelectedUser(null);
            setSearchTerm("");
            setRecipients([]);
          }}
          className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
        >
          <option value="">Choose audience type...</option>
          {AUDIENCE_OPTIONS.map((opt) => {
            let count = "";
            if (opt.value.startsWith("role:")) {
              const role = opt.value.split(":")[1];
              count = roleCounts[role] ? ` (${roleCounts[role]})` : "";
            }
            return (
              <option key={opt.value} value={opt.value}>
                {opt.icon} {opt.label}{count}
              </option>
            );
          })}
        </select>
      </div>

      {/* Department Dropdown */}
      {audienceType === "department" && (
        <div className="mb-4">
          <label className="mb-2 block text-sm text-slate-400">
            Select Department
          </label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none"
          >
            <option value="">Choose department...</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Individual User Search */}
      {audienceType === "individual" && (
        <div className="mb-4">
          {selectedUser ? (
            <div className="flex items-center justify-between rounded-lg border border-purple-500/30 bg-purple-500/10 p-3">
              <div>
                <p className="text-sm font-medium text-white">
                  {selectedUser.full_name || "Unnamed"}
                </p>
                <p className="text-xs text-slate-400">
                  {selectedUser.email} · {selectedUser.role}
                </p>
              </div>
              <button
                onClick={clearSelection}
                className="rounded-lg px-3 py-1 text-xs text-slate-400 hover:bg-white/10 hover:text-white"
              >
                ✕ Change
              </button>
            </div>
          ) : (
            <div className="relative">
              <label className="mb-2 block text-sm text-slate-400">
                Search by name or email
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Type at least 2 characters..."
                className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
              />
              {searchResults.length > 0 && (
                <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-white/10 bg-slate-800 shadow-xl">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => selectUser(user)}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-white/5"
                    >
                      <div>
                        <p className="text-sm text-white">
                          {user.full_name || "Unnamed"}
                        </p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs capitalize text-slate-300">
                        {user.role}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center gap-2 py-3 text-sm text-slate-400">
          <span className="animate-spin">⏳</span> Loading recipients...
        </div>
      )}

      {/* Recipient Preview */}
      {recipients.length > 0 && !loading && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-300">
              {recipients.length} recipient{recipients.length !== 1 ? "s" : ""}
            </span>
            <div className="flex gap-3 text-xs text-slate-400">
              <span>
                📧 {recipients.filter((r) => r.email).length} with email
              </span>
              <span>
                📱 {recipients.filter((r) => r.phone_number).length} with phone
              </span>
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto rounded-lg border border-white/5 bg-slate-900/50">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/5 text-slate-500">
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Phone</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recipients.map((r) => (
                  <tr key={r.id} className="hover:bg-white/5">
                    <td className="whitespace-nowrap px-3 py-2 text-white">
                      {r.full_name || "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-300">
                      {r.email}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-slate-300">
                      {r.phone_number || "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 capitalize text-slate-400">
                      {r.role}
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
