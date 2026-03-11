"use client";

import { useState } from "react";
import { updateAdminProfile } from "@/app/actions/admin";

interface AdminProfileEditFormProps {
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
  };
}

export default function AdminProfileEditForm({
  profile,
}: AdminProfileEditFormProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!editing) {
    return (
      <div className="mt-6 flex justify-end">
        <button
          onClick={() => setEditing(true)}
          className="rounded-lg bg-purple-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-purple-500"
        >
          Edit Profile
        </button>
      </div>
    );
  }

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    try {
      await updateAdminProfile(formData);
      setEditing(false);
    } catch {
      alert("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500";
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

      {/* Institution */}
      <div>
        <label htmlFor="institution" className={labelClass}>
          Institution / Organization
        </label>
        <input
          id="institution"
          name="institution"
          defaultValue={profile.institution ?? ""}
          placeholder="e.g. University Name, Department"
          className={inputClass}
        />
      </div>

      {/* Department / Role */}
      <div>
        <label htmlFor="department" className={labelClass}>
          Department / Role
        </label>
        <input
          id="department"
          name="department"
          defaultValue={profile.department ?? ""}
          placeholder="e.g. Innovation Cell, Administration"
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
          Bio / About
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          defaultValue={profile.bio ?? ""}
          placeholder="Brief description of your role and responsibilities..."
          className={inputClass}
        />
      </div>

      {/* Skills */}
      <div>
        <label htmlFor="skills" className={labelClass}>
          Skills / Expertise{" "}
          <span className="text-slate-500">(comma-separated)</span>
        </label>
        <input
          id="skills"
          name="skills"
          defaultValue={profile.skills?.join(", ") ?? ""}
          placeholder="e.g. Community Management, Strategy, Operations"
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
          placeholder="e.g. Innovation, Entrepreneurship, Technology Policy"
          className={inputClass}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-purple-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          disabled={saving}
          className="rounded-lg border border-white/10 px-6 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
