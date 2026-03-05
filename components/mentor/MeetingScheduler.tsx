"use client";

import { useState } from "react";

interface MeetingSchedulerProps {
  menteeName: string;
  menteePhone?: string;
}

export default function MeetingScheduler({
  menteeName,
  menteePhone,
}: MeetingSchedulerProps) {
  const [title, setTitle] = useState("Mentorship Session");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("30");
  const [notes, setNotes] = useState("");

  const generateGoogleCalendarLink = () => {
    if (!date || !time) {
      alert("Please select date and time");
      return;
    }

    const datetime = new Date(`${date}T${time}`);
    const endTime = new Date(datetime.getTime() + parseInt(duration) * 60000);

    // Format for Google Calendar
    const formatDate = (d: Date) => {
      return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    };

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: title,
      dates: `${formatDate(datetime)}/${formatDate(endTime)}`,
      details: notes || `Mentorship session with ${menteeName}`,
      add: menteePhone || "",
    });

    window.open(
      `https://calendar.google.com/calendar/render?${params.toString()}`,
      "_blank",
    );
  };

  const generateWhatsAppLink = () => {
    if (!date || !time) {
      alert("Please select date and time");
      return;
    }

    const datetime = new Date(`${date}T${time}`);
    const formattedDate = datetime.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    const formattedTime = datetime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    const message = `Hi ${menteeName}! I've scheduled our mentorship session:\n\n📅 ${formattedDate}\n⏰ ${formattedTime}\n⏱️ Duration: ${duration} minutes\n\n${notes ? `Notes: ${notes}\n\n` : ""}Looking forward to our session!`;

    window.open(
      `https://wa.me/${menteePhone || ""}?text=${encodeURIComponent(message)}`,
      "_blank",
    );
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <h3 className="mb-4 font-semibold text-white">Schedule Meeting</h3>

      <div className="space-y-4">
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
            onClick={generateGoogleCalendarLink}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600/20 px-4 py-2.5 text-sm font-medium text-blue-400 ring-1 ring-blue-600/30 transition hover:bg-blue-600/30"
          >
            📅 Add to Google Calendar
          </button>
          <button
            onClick={generateWhatsAppLink}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600/20 px-4 py-2.5 text-sm font-medium text-green-400 ring-1 ring-green-600/30 transition hover:bg-green-600/30"
          >
            💬 Send via WhatsApp
          </button>
        </div>

        <p className="text-xs text-slate-500">
          💡 Tip: Use Google Calendar to generate a Meet link, then share via
          WhatsApp
        </p>
      </div>
    </div>
  );
}
