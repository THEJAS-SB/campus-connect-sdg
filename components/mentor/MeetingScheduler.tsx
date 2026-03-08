"use client";

import { useState } from "react";
import { scheduleMeeting } from "@/app/actions/mentor";

interface Mentee {
  matchId: string;
  menteeId: string;
  menteeName: string;
  menteeRsId: string;
}

interface MeetingSchedulerProps {
  mentees: Mentee[];
}

export default function MeetingScheduler({
  mentees,
}: MeetingSchedulerProps) {
  const [selectedMentee, setSelectedMentee] = useState(mentees[0]?.menteeId ?? "");
  const [title, setTitle] = useState("Mentorship Session");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("30");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const currentMentee = mentees.find((m) => m.menteeId === selectedMentee);

  async function handleSchedule() {
    if (!date || !time || !currentMentee) {
      alert("Please select a mentee, date, and time");
      return;
    }

    setSaving(true);
    setSuccess(false);
    try {
      await scheduleMeeting({
        matchId: currentMentee.matchId,
        menteeId: currentMentee.menteeId,
        title,
        description: notes || undefined,
        scheduledAt: new Date(`${date}T${time}`).toISOString(),
        durationMinutes: parseInt(duration),
      });
      setSuccess(true);
      setNotes("");
    } catch (err) {
      alert("Failed to schedule meeting. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {success && (
        <div className="rounded-lg bg-green-500/10 px-4 py-2 text-sm text-green-400 ring-1 ring-green-500/30">
          Meeting scheduled successfully!
        </div>
      )}

      {/* Mentee Selector */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-400">
          Mentee
        </label>
        <select
          value={selectedMentee}
          onChange={(e) => setSelectedMentee(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
        >
          {mentees.map((m) => (
            <option key={m.menteeId} value={m.menteeId}>
              {m.menteeName} ({m.menteeRsId})
            </option>
          ))}
        </select>
      </div>

      {/* Title */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-400">
          Meeting Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
          placeholder="Mentorship Session"
        />
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-400">
            Time
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
          />
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-400">
          Duration (minutes)
        </label>
        <select
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
        >
          <option value="15">15 minutes</option>
          <option value="30">30 minutes</option>
          <option value="45">45 minutes</option>
          <option value="60">1 hour</option>
          <option value="90">1.5 hours</option>
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-slate-400">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
          placeholder="Topics to cover, preparation needed, etc."
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleSchedule}
          disabled={saving}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-purple-600/20 px-4 py-2.5 text-sm font-medium text-purple-400 ring-1 ring-purple-600/30 transition hover:bg-purple-600/30 disabled:opacity-50"
        >
          {saving ? "Scheduling..." : "📅 Schedule Meeting"}
        </button>
      </div>
    </div>
  );
}
