'use client'

import { useState } from 'react'
import { updateProfile } from '@/app/actions/student'

interface ProfileEditFormProps {
  profile: {
    email: string
    full_name: string | null
    bio: string | null
    institution: string | null
    department: string | null
    phone_number: string | null
    linkedin_url: string | null
    skills: string[] | null
  }
}

export default function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  if (!editing) {
    return (
      <div className="mt-6 flex justify-end">
        <button
          onClick={() => setEditing(true)}
          className="rounded-lg bg-purple-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-purple-700"
        >
          Edit Profile
        </button>
      </div>
    )
  }

  async function handleSubmit(formData: FormData) {
    setSaving(true)
    try {
      await updateProfile(formData)
      setEditing(false)
    } catch {
      alert('Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form action={handleSubmit} className="mt-6 space-y-4 border-t border-white/10 pt-6">
      <h3 className="text-lg font-semibold text-white">Edit Profile</h3>

      <div>
        <label htmlFor="full_name" className="mb-1.5 block text-sm font-medium text-slate-300">
          Full Name
        </label>
        <input
          id="full_name"
          name="full_name"
          defaultValue={profile.full_name ?? ''}
          placeholder="Your full name"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
        />
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-300">
          Email
        </label>
        <input
          id="email"
          name="email"
          value={profile.email}
          readOnly
          className="w-full cursor-not-allowed rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-slate-300 placeholder-slate-500 outline-none"
        />
      </div>

      <div>
        <label htmlFor="bio" className="mb-1.5 block text-sm font-medium text-slate-300">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          defaultValue={profile.bio ?? ''}
          placeholder="Tell us about yourself and your interests..."
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
        />
      </div>

      <div>
        <label htmlFor="institution" className="mb-1.5 block text-sm font-medium text-slate-300">
          Institution
        </label>
        <input
          id="institution"
          name="institution"
          defaultValue={profile.institution ?? ''}
          placeholder="e.g. MIT, Stanford University"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
        />
      </div>

      <div>
        <label htmlFor="department" className="mb-1.5 block text-sm font-medium text-slate-300">
          Department
        </label>
        <input
          id="department"
          name="department"
          defaultValue={profile.department ?? ''}
          placeholder="e.g. Computer Science, Business"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
        />
      </div>

      <div>
        <label htmlFor="phone_number" className="mb-1.5 block text-sm font-medium text-slate-300">
          Phone Number
        </label>
        <input
          id="phone_number"
          name="phone_number"
          defaultValue={profile.phone_number ?? ''}
          placeholder="e.g. +91 9876543210"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
        />
      </div>

      <div>
        <label htmlFor="linkedin_url" className="mb-1.5 block text-sm font-medium text-slate-300">
          LinkedIn ID / URL
        </label>
        <input
          id="linkedin_url"
          name="linkedin_url"
          defaultValue={profile.linkedin_url ?? ''}
          placeholder="e.g. https://linkedin.com/in/your-id"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
        />
      </div>

      <div>
        <label htmlFor="skills" className="mb-1.5 block text-sm font-medium text-slate-300">
          Skills <span className="text-slate-500">(comma-separated)</span>
        </label>
        <input
          id="skills"
          name="skills"
          defaultValue={profile.skills?.join(', ') ?? ''}
          placeholder="e.g. React, Python, Machine Learning"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-slate-500 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-purple-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
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
  )
}
