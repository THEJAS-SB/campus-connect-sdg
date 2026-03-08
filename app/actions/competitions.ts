"use server";

import { createClient } from "@/lib/supabase/server";

export interface Competition {
  id: string;
  title: string;
  platform: string;
  tags: string[];
  deadline: string;
  url: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  prize: string;
  description: string;
}

export interface ScoredCompetition extends Competition {
  matchedTags: string[];
}

// ── In-memory cache (per server instance, 30-min TTL) ───────────────────

let cachedCompetitions: Competition[] = [];
let cacheTimestamp = 0;
const CACHE_TTL_MS = 30 * 60 * 1000;

// ── Devpost API ─────────────────────────────────────────────────────────

interface DevpostHackathon {
  id: number;
  title: string;
  submission_period_dates: string;
  url: string;
  prize_amount?: string;
  themes?: { name: string }[];
  open_state: string;
}

async function fetchDevpost(): Promise<Competition[]> {
  try {
    const res = await fetch(
      "https://devpost.com/api/hackathons?status=upcoming&order_by=deadline&page=1&per_page=20",
      { next: { revalidate: 1800 } },
    );
    if (!res.ok) return [];

    const data = (await res.json()) as { hackathons: DevpostHackathon[] };
    if (!Array.isArray(data.hackathons)) return [];

    return data.hackathons.map((h) => {
      const tags = (h.themes ?? []).map((t) => t.name.toLowerCase());
      return {
        id: `devpost-${h.id}`,
        title: h.title,
        platform: "Devpost",
        tags,
        deadline: extractDeadline(h.submission_period_dates),
        url: h.url,
        difficulty: inferDifficulty(tags),
        prize: h.prize_amount ?? "See details",
        description: `Hackathon on Devpost — ${h.submission_period_dates}`,
      };
    });
  } catch {
    return [];
  }
}

// ── Kontests.net API (aggregates LeetCode, Codeforces, HackerRank…) ────

interface KontestEntry {
  name: string;
  url: string;
  start_time: string;
  end_time: string;
  duration: string;
  site: string;
  in_24_hours: string;
  status: string;
}

async function fetchKontests(): Promise<Competition[]> {
  try {
    const res = await fetch("https://kontests.net/api/v1/all", {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return [];

    const data = (await res.json()) as KontestEntry[];
    if (!Array.isArray(data)) return [];

    const now = new Date();
    return data
      .filter((k) => new Date(k.end_time) > now)
      .slice(0, 30)
      .map((k, i) => {
        const siteLower = k.site.toLowerCase();
        const tags = deriveTags(siteLower);
        return {
          id: `kontest-${i}-${siteLower.replace(/\s+/g, "")}`,
          title: k.name,
          platform: k.site,
          tags,
          deadline: k.end_time.split("T")[0] ?? k.end_time,
          url: k.url,
          difficulty: inferDifficultyFromSite(siteLower),
          prize: "Ranking / Ratings",
          description: `Live contest on ${k.site} — starts ${formatDate(k.start_time)}`,
        };
      });
  } catch {
    return [];
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────

function extractDeadline(dateStr: string): string {
  // Devpost returns e.g. "Mar 15 - Apr 20, 2026" — take end portion
  const match = dateStr.match(/(\w{3}\s+\d{1,2},?\s*\d{4}|\d{4}-\d{2}-\d{2})$/);
  if (match) {
    const d = new Date(match[1]);
    if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  }
  // fallback: try parsing whole string
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  // last resort: 30 days from now
  const fb = new Date();
  fb.setDate(fb.getDate() + 30);
  return fb.toISOString().split("T")[0];
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function inferDifficulty(
  tags: string[],
): "Beginner" | "Intermediate" | "Advanced" {
  const joined = tags.join(" ");
  if (/beginner|intro|starter|first/i.test(joined)) return "Beginner";
  if (/advanced|expert|research|ml|blockchain/i.test(joined)) return "Advanced";
  return "Intermediate";
}

function inferDifficultyFromSite(
  site: string,
): "Beginner" | "Intermediate" | "Advanced" {
  if (/codeforces|topcoder|atcoder/i.test(site)) return "Advanced";
  if (/leetcode|codechef|hackerearth/i.test(site)) return "Intermediate";
  return "Beginner";
}

function deriveTags(site: string): string[] {
  const base = ["competitive programming", "algorithms", "problem solving"];
  if (/leetcode/i.test(site))
    return [...base, "data structures", "javascript", "python"];
  if (/codeforces/i.test(site))
    return [...base, "c++", "mathematics", "dynamic programming"];
  if (/codechef/i.test(site)) return [...base, "python", "c++", "java"];
  if (/hackerrank/i.test(site))
    return [...base, "python", "sql", "data structures"];
  if (/hackerearth/i.test(site))
    return [...base, "machine learning", "python", "data science"];
  if (/atcoder/i.test(site))
    return [...base, "mathematics", "c++", "dynamic programming"];
  if (/topcoder/i.test(site)) return [...base, "java", "c++", "design"];
  return [...base, "coding"];
}

// ── Fetch & cache all competitions ──────────────────────────────────────

async function fetchAllCompetitions(): Promise<Competition[]> {
  const now = Date.now();
  if (cachedCompetitions.length > 0 && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedCompetitions;
  }

  const [devpost, kontests] = await Promise.all([
    fetchDevpost(),
    fetchKontests(),
  ]);

  const all = [...devpost, ...kontests];

  // De-duplicate by URL
  const seen = new Set<string>();
  const unique = all.filter((c) => {
    if (seen.has(c.url)) return false;
    seen.add(c.url);
    return true;
  });

  // Filter to upcoming only
  const today = new Date();
  const upcoming = unique.filter((c) => new Date(c.deadline) > today);

  // Sort by deadline (soonest first)
  upcoming.sort(
    (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
  );

  cachedCompetitions = upcoming;
  cacheTimestamp = now;
  return upcoming;
}

// ── Scoring ─────────────────────────────────────────────────────────────

function scoreCompetition(
  competition: Competition,
  userSkills: string[],
): { score: number; matchedTags: string[] } {
  const normalised = userSkills.map((s) => s.toLowerCase().trim());
  const matchedTags = competition.tags.filter((tag) =>
    normalised.some((skill) => tag.includes(skill) || skill.includes(tag)),
  );
  return { score: matchedTags.length, matchedTags };
}

// ── Public server actions ───────────────────────────────────────────────

export async function getRecommendedCompetitions(
  userSkills: string[],
): Promise<ScoredCompetition[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const competitions = await fetchAllCompetitions();

  if (!userSkills.length)
    return competitions.slice(0, 3).map((c) => ({ ...c, matchedTags: [] }));

  const scored = competitions.map((c) => {
    const { score, matchedTags } = scoreCompetition(c, userSkills);
    return { ...c, matchedTags, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 3).map(({ score: _score, ...rest }) => rest);
}

export async function getAllCompetitions(
  userSkills: string[],
): Promise<ScoredCompetition[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const competitions = await fetchAllCompetitions();

  if (!userSkills.length)
    return competitions.map((c) => ({ ...c, matchedTags: [] }));

  const scored = competitions.map((c) => {
    const { score, matchedTags } = scoreCompetition(c, userSkills);
    return { ...c, matchedTags, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored.map(({ score: _score, ...rest }) => rest);
}
