"use client";

import { useState, useTransition, useCallback } from "react";
import {
  broadcastPost,
  type Platform,
  type BroadcastResponse,
} from "@/app/actions/social-share";

const PLATFORMS: {
  id: Platform;
  label: string;
  icon: string;
  color: string;
}[] = [
  {
    id: "linkedin",
    label: "LinkedIn",
    icon: "💼",
    color: "bg-[#0A66C2]/20 ring-[#0A66C2]/40 text-[#70aae0]",
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: "💬",
    color: "bg-[#25D366]/10 ring-[#25D366]/30 text-[#25D366]",
  },
];

// ── Deep-link helpers (Task 2) ──────────────────────────────────────────

function openDeepLinks(text: string, platforms: Platform[]) {
  const encoded = encodeURIComponent(text);

  // Build a list of URLs to open
  const urls: { platform: Platform; url: string }[] = [];

  for (const p of platforms) {
    switch (p) {
      case "whatsapp":
        urls.push({ platform: p, url: `https://wa.me/?text=${encoded}` });
        break;
      case "linkedin":
        // Use the feed share endpoint which supports pre-filled text
        urls.push({
          platform: p,
          url: `https://www.linkedin.com/feed/?shareActive=true&text=${encoded}`,
        });
        break;
    }
  }

  // Open the first link directly (least likely to be blocked).
  // Remaining links are shown as fallback buttons to avoid popup blockers.
  if (urls.length === 1) {
    window.open(urls[0].url, "_blank");
    return [];
  }

  // Open the first immediately, return the rest as pending fallbacks
  window.open(urls[0].url, "_blank");
  return urls.slice(1);
}

// ── Component ───────────────────────────────────────────────────────────

interface MultiPlatformShareProps {
  /** Pre-filled text (e.g. from an achievement card) */
  defaultText?: string;
}

export default function MultiPlatformShare({
  defaultText = "",
}: MultiPlatformShareProps) {
  const [text, setText] = useState(defaultText);
  const [selected, setSelected] = useState<Set<Platform>>(new Set());
  const [directPost, setDirectPost] = useState(false);
  const [pending, startTransition] = useTransition();

  // Fallback links when popup-blocker prevents sequential window.open
  const [fallbackLinks, setFallbackLinks] = useState<
    { platform: Platform; url: string }[]
  >([]);

  // Server action result
  const [response, setResponse] = useState<BroadcastResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const togglePlatform = useCallback((p: Platform) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }, []);

  const handleBroadcast = () => {
    if (!text.trim() || selected.size === 0) return;

    setError(null);
    setResponse(null);
    setFallbackLinks([]);

    const platforms = Array.from(selected);

    if (!directPost) {
      // ── Open App mode (deep links) ──
      const remaining = openDeepLinks(text, platforms);
      setFallbackLinks(remaining);
      return;
    }

    // ── Direct Post mode (server action) ──
    startTransition(async () => {
      try {
        const res = await broadcastPost(text, platforms);
        setResponse(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Broadcast failed");
      }
    });
  };

  const canSubmit = text.trim().length > 0 && selected.size > 0 && !pending;

  return (
    <div className="w-full rounded-xl border border-white/10 bg-white/5 p-6">
      {/* ── Header ── */}
      <h3 className="mb-4 text-lg font-semibold text-white">
        Whatsapp & LinkedIn Share
      </h3>

      {/* ── Textarea ── */}
      <textarea
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your achievement post…"
        className="w-full resize-none rounded-lg border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40"
      />

      {/* ── Platform checkboxes ── */}
      <fieldset className="mt-4">
        <legend className="mb-2 text-xs font-medium text-slate-400">
          Select platforms
        </legend>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => {
            const isActive = selected.has(p.id);
            return (
              <label
                key={p.id}
                className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ring-1 transition select-none ${
                  isActive
                    ? p.color
                    : "bg-white/5 text-slate-400 ring-white/10 hover:bg-white/10"
                }`}
              >
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={() => togglePlatform(p.id)}
                  className="sr-only"
                />
                <span>{p.icon}</span>
                {p.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* ── Mode toggle ── */}
      <div className="mt-4 flex items-center justify-between rounded-lg border border-white/10 bg-slate-800/60 px-4 py-3">
        <span className="text-sm text-slate-300">
          {directPost ? "Direct Post (API)" : "Open App (Deep Link)"}
        </span>

        <button
          type="button"
          role="switch"
          aria-checked={directPost}
          onClick={() => setDirectPost((v) => !v)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
            directPost ? "bg-purple-600" : "bg-slate-600"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
              directPost ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* ── Broadcast button ── */}
      <button
        disabled={!canSubmit}
        onClick={handleBroadcast}
        className="mt-5 w-full rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {pending ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            Broadcasting…
          </span>
        ) : (
          "🚀 Broadcast"
        )}
      </button>

      {/* ── Fallback links (popup-blocker workaround) ── */}
      {fallbackLinks.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="mb-2 text-xs font-medium text-amber-400">
            Your browser may have blocked extra tabs. Open remaining platforms:
          </p>
          <div className="flex flex-wrap gap-2">
            {fallbackLinks.map((link) => (
              <a
                key={link.platform}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white ring-1 ring-white/10 transition hover:bg-white/20"
              >
                Open{" "}
                {link.platform.charAt(0).toUpperCase() + link.platform.slice(1)}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── Server action results ── */}
      {error && (
        <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {response && (
        <div className="mt-4 space-y-2">
          {response.results.map((r) => (
            <div
              key={r.platform}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm ${
                r.success
                  ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                  : "border border-red-500/20 bg-red-500/10 text-red-400"
              }`}
            >
              <span>{r.success ? "✅" : "❌"}</span>
              <span className="font-medium capitalize">{r.platform}</span>
              {r.error && (
                <span className="ml-auto text-xs opacity-80">– {r.error}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
