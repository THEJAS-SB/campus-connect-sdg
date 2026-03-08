"use client";

import { useState } from "react";
import {
  logBroadcast,
  type AudienceFilter,
  type Recipient,
} from "@/app/actions/admin";

interface MessageComposerProps {
  recipients: Recipient[];
  audienceFilter: AudienceFilter | null;
}

export default function MessageComposer({
  recipients,
  audienceFilter,
}: MessageComposerProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [showWhatsAppLinks, setShowWhatsAppLinks] = useState(false);
  const [sentStatus, setSentStatus] = useState<string | null>(null);

  const canSend = recipients.length > 0 && subject.trim() && body.trim();
  const recipientsWithEmail = recipients.filter((r) => r.email);
  const recipientsWithPhone = recipients.filter((r) => r.phone_number);

  const handleSendEmail = async () => {
    if (!canSend) return;
    setSending(true);

    try {
      // Build Gmail compose URL — opens in a new tab in the same browser
      const emails = recipientsWithEmail.map((r) => r.email).join(",");
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&bcc=${encodeURIComponent(emails)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      // Open in new tab
      window.open(gmailUrl, "_blank");

      // Log broadcast
      if (audienceFilter) {
        await logBroadcast(
          subject,
          body,
          audienceFilter.type,
          audienceFilter.value ? { value: audienceFilter.value } : {},
          recipients.map((r) => r.id),
          ["email"],
        );
      }

      setSentStatus(
        `✅ Email client opened for ${recipientsWithEmail.length} recipient(s). In-app notifications sent.`,
      );
    } catch (err) {
      setSentStatus("❌ Failed to log broadcast. Email may still have opened.");
    } finally {
      setSending(false);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!canSend) return;

    if (recipientsWithPhone.length === 1) {
      // Single recipient — open directly
      setSending(true);
      const phone = recipientsWithPhone[0].phone_number!.replace(/\D/g, "");
      const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(`*${subject}*\n\n${body}`)}`;
      window.open(waUrl, "_blank");

      if (audienceFilter) {
        await logBroadcast(
          subject,
          body,
          audienceFilter.type,
          audienceFilter.value ? { value: audienceFilter.value } : {},
          recipients.map((r) => r.id),
          ["whatsapp"],
        );
      }

      setSentStatus("✅ WhatsApp opened. In-app notifications sent.");
      setSending(false);
    } else {
      // Multiple recipients — show clickable links
      setShowWhatsAppLinks(true);

      // Log broadcast once
      if (audienceFilter && !sentStatus?.includes("WhatsApp links")) {
        setSending(true);
        await logBroadcast(
          subject,
          body,
          audienceFilter.type,
          audienceFilter.value ? { value: audienceFilter.value } : {},
          recipients.map((r) => r.id),
          ["whatsapp"],
        );
        setSentStatus(
          `✅ WhatsApp links ready for ${recipientsWithPhone.length} recipient(s). In-app notifications sent. Click each link below.`,
        );
        setSending(false);
      }
    }
  };

  const handleSendBoth = async () => {
    if (!canSend) return;
    setSending(true);

    try {
      // Open email in Gmail compose tab
      const emails = recipientsWithEmail.map((r) => r.email).join(",");
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&bcc=${encodeURIComponent(emails)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(gmailUrl, "_blank");

      // Handle WhatsApp
      if (recipientsWithPhone.length === 1) {
        const phone = recipientsWithPhone[0].phone_number!.replace(/\D/g, "");
        const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(`*${subject}*\n\n${body}`)}`;
        window.open(waUrl, "_blank");
      } else if (recipientsWithPhone.length > 1) {
        setShowWhatsAppLinks(true);
      }

      // Log broadcast with both channels
      const channels: string[] = [];
      if (recipientsWithEmail.length > 0) channels.push("email");
      if (recipientsWithPhone.length > 0) channels.push("whatsapp");

      if (audienceFilter) {
        await logBroadcast(
          subject,
          body,
          audienceFilter.type,
          audienceFilter.value ? { value: audienceFilter.value } : {},
          recipients.map((r) => r.id),
          channels,
        );
      }

      setSentStatus(
        `✅ Email opened for ${recipientsWithEmail.length} & WhatsApp for ${recipientsWithPhone.length} recipient(s). In-app notifications sent.`,
      );
    } catch {
      setSentStatus("❌ Failed to log broadcast.");
    } finally {
      setSending(false);
    }
  };

  const whatsAppMessage = `*${subject}*\n\n${body}`;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <h3 className="mb-4 text-lg font-semibold text-white">✍️ Mail</h3>

      {/* Subject */}
      <div className="mb-4">
        <label className="mb-2 block text-sm text-slate-400">
          Subject{" "}
          <span className="text-slate-500">
            (used as email subject & WhatsApp heading)
          </span>
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. Important: Upcoming Demo Day Registration"
          className="w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
        />
      </div>

      {/* Body */}
      <div className="mb-4">
        <label className="mb-2 block text-sm text-slate-400">
          Message Body
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type your message here..."
          rows={6}
          className="w-full resize-y rounded-lg border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-slate-500">{body.length} characters</p>
      </div>

      {/* Preview */}
      {(subject || body) && (
        <div className="mb-6 rounded-lg border border-white/5 bg-slate-900/50 p-4">
          <p className="mb-1 text-xs font-medium uppercase text-slate-500">
            Preview
          </p>
          {subject && (
            <p className="text-sm font-semibold text-white">{subject}</p>
          )}
          {body && (
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-300">
              {body}
            </p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleSendEmail}
          disabled={!canSend || sending || recipientsWithEmail.length === 0}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          📧 Send via Email
          {recipientsWithEmail.length > 0 && (
            <span className="rounded-full bg-blue-500/50 px-2 py-0.5 text-xs">
              {recipientsWithEmail.length}
            </span>
          )}
        </button>
      </div>

      {/* Status Message */}
      {sentStatus && (
        <div className="mt-4 rounded-lg border border-white/10 bg-slate-900/50 p-3 text-sm text-slate-300">
          {sentStatus}
        </div>
      )}

      {/* WhatsApp Links for Multiple Recipients */}
      {showWhatsAppLinks && recipientsWithPhone.length > 1 && (
        <div className="mt-4 rounded-lg border border-green-500/20 bg-green-500/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-green-400">
              💬 WhatsApp Links ({recipientsWithPhone.length} recipients)
            </h4>
            <button
              onClick={() => setShowWhatsAppLinks(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ✕ Close
            </button>
          </div>
          <p className="mb-3 text-xs text-slate-400">
            Click each link to open WhatsApp with the pre-filled message for
            that recipient. WhatsApp only supports one recipient per message.
          </p>
          <div className="max-h-60 space-y-2 overflow-y-auto">
            {recipientsWithPhone.map((r) => {
              const phone = r.phone_number!.replace(/\D/g, "");
              const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(whatsAppMessage)}`;
              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-800 px-3 py-2"
                >
                  <div>
                    <p className="text-sm text-white">
                      {r.full_name || "Unnamed"}
                    </p>
                    <p className="text-xs text-slate-400">{r.phone_number}</p>
                  </div>
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                  >
                    Open WhatsApp →
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
