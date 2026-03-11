"use client";

import { useState } from "react";
import { updateInvestorProfile } from "@/app/actions/investor";

const SDG_LIST = [
  { id: 1, label: "No Poverty" },
  { id: 2, label: "Zero Hunger" },
  { id: 3, label: "Good Health & Well-being" },
  { id: 4, label: "Quality Education" },
  { id: 5, label: "Gender Equality" },
  { id: 6, label: "Clean Water & Sanitation" },
  { id: 7, label: "Affordable & Clean Energy" },
  { id: 8, label: "Decent Work & Economic Growth" },
  { id: 9, label: "Industry, Innovation & Infrastructure" },
  { id: 10, label: "Reduced Inequalities" },
  { id: 11, label: "Sustainable Cities & Communities" },
  { id: 12, label: "Responsible Consumption & Production" },
  { id: 13, label: "Climate Action" },
  { id: 14, label: "Life Below Water" },
  { id: 15, label: "Life on Land" },
  { id: 16, label: "Peace, Justice & Strong Institutions" },
  { id: 17, label: "Partnerships for the Goals" },
];

interface InvestorProfileEditFormProps {
  profile: {
    email: string;
    full_name: string | null;
    bio: string | null;
    institution: string | null;
    department: string | null;
    phone_number: string | null;
    linkedin_url: string | null;
    skills: string[] | null;
    interests: string[] | null;
    sdgs: number[] | null;
  };
}

export default function InvestorProfileEditForm({
  profile,
}: InvestorProfileEditFormProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedSdgs, setSelectedSdgs] = useState<number[]>(
    profile.sdgs ?? [],
  );

  if (!editing) {
    return (
      <div className="mt-6 flex justify-end">
        <button
          onClick={() => setEditing(true)}
          className="rounded-lg bg-green-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-green-500"
        >
          Edit Profile
        </button>
      </div>
    );
  }

  function toggleSdg(id: number) {
    setSelectedSdgs((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    formData.set("sdgs", selectedSdgs.join(","));
    try {
      await updateInvestorProfile(formData);
      setEditing(false);
    } catch {
      alert("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500";
  const labelClass = "mb-1.5 block text-sm font-medium text-slate-300";

  return (
    <form
      action={handleSubmit}
      className="mt-6 space-y-5 border-t border-white/10 pt-6"
    >
      <h3 className="text-lg font-semibold text-white">Edit Profile</h3>

      {/* Full Name */}
      <div>
        <label htmlFor="full_name" className={labelClass}>
          Full Name
        </label>
        <input
          id="full_name"
          name="full_name"
          defaultValue={profile.full_name ?? ""}
          placeholder="Your full name"
          className={inputClass}
        />
      </div>

      {/* Email (read-only) */}
      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          name="email"
          value={profile.email}
          readOnly
          className="w-full cursor-not-allowed rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-slate-400 outline-none"
        />
      </div>

      {/* Institution / Firm */}
      <div>
        <label htmlFor="institution" className={labelClass}>
          Firm / Organization
        </label>
        <input
          id="institution"
          name="institution"
          defaultValue={profile.institution ?? ""}
          placeholder="e.g. Sequoia Capital, Angel Network"
          className={inputClass}
        />
      </div>

      {/* Department / Fund */}
      <div>
        <label htmlFor="department" className={labelClass}>
          Fund / Team
        </label>
        <input
          id="department"
          name="department"
          defaultValue={profile.department ?? ""}
          placeholder="e.g. Seed Fund, Series A"
          className={inputClass}
        />
      </div>

      {/* Phone Number */}
      <div>
        <label htmlFor="phone_number" className={labelClass}>
          Phone Number
        </label>
        <input
          id="phone_number"
          name="phone_number"
          defaultValue={profile.phone_number ?? ""}
          placeholder="e.g. +91 9876543210"
          className={inputClass}
        />
      </div>

      {/* LinkedIn */}
      <div>
        <label htmlFor="linkedin_url" className={labelClass}>
          LinkedIn URL
        </label>
        <input
          id="linkedin_url"
          name="linkedin_url"
          defaultValue={profile.linkedin_url ?? ""}
          placeholder="https://linkedin.com/in/your-profile"
          className={inputClass}
        />
      </div>

      {/* Bio */}
      <div>
        <label htmlFor="bio" className={labelClass}>
          Investment Philosophy / Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={profile.bio ?? ""}
          placeholder="Describe your investment thesis, focus areas and what you look for in startups..."
          className={inputClass}
        />
      </div>

      {/* Investment Domains / Expertise */}
      <div>
        <label htmlFor="skills" className={labelClass}>
          Investment Domains{" "}
          <span className="text-slate-500">(comma-separated)</span>
        </label>
        <input
          id="skills"
          name="skills"
          defaultValue={profile.skills?.join(", ") ?? ""}
          placeholder="e.g. FinTech, EdTech, HealthTech, Deep Tech"
          className={inputClass}
        />
      </div>

      {/* Interests */}
      <div>
        <label htmlFor="interests" className={labelClass}>
          Interests <span className="text-slate-500">(comma-separated)</span>
        </label>
        <input
          id="interests"
          name="interests"
          defaultValue={profile.interests?.join(", ") ?? ""}
          placeholder="e.g. AI/ML, Climate Tech, Social Impact"
          className={inputClass}
        />
      </div>

      {/* SDG Focus */}
      <div>
        <label className={labelClass}>
          SDG Investment Focus{" "}
          <span className="text-slate-500">(select all that apply)</span>
        </label>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SDG_LIST.map((sdg) => {
            const selected = selectedSdgs.includes(sdg.id);
            return (
              <button
                key={sdg.id}
                type="button"
                onClick={() => toggleSdg(sdg.id)}
                className={`rounded-lg border px-3 py-2 text-left text-xs font-medium transition ${
                  selected
                    ? "border-green-500/60 bg-green-500/20 text-green-300"
                    : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:bg-white/10"
                }`}
              >
                <span className="font-bold">SDG {sdg.id}</span>
                <br />
                {sdg.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-green-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-green-500 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setSelectedSdgs(profile.sdgs ?? []);
          }}
          disabled={saving}
          className="rounded-lg border border-white/10 px-6 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
