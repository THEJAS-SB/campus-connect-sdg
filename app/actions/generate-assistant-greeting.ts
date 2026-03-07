"use server";

import Groq from "groq-sdk";
import { createClient } from "@/lib/supabase/server";

/* ── Public types ── */
export interface GuideContext {
  userId: string;
  profileCompleted: boolean;
  startupStage: string | null;
  pendingMissions: number;
  notificationCount: number;
  streak: number;
  fullName: string;
  welcomeQuote: string;
}

/* ── Groq prompt for returning-user welcome ── */
const WELCOME_PROMPT = `You are INNO, the fun AI mascot for "INNOVEX" Campus Innovation platform.
Generate a SHORT welcome-back message for a returning student. Include a funny or motivational quote about innovation, startups, or coding.
Keep it under 120 characters. Be witty, warm, and encouraging.
Examples of tone:
- "Welcome back, legend! Remember: every bug is just an undocumented feature 😄"
- "You're back! 🔥 Even Elon started with just an idea. Let's build yours!"
- "Hey innovator! I've been waiting — my circuits were getting lonely 🤖"

You MUST respond ONLY with a valid JSON object: {"quote": "your message here"}`;

/* ── Fallback quotes used when Groq is unreachable ── */
const FALLBACK_QUOTES = [
  "Welcome back, innovator! Let's make today count! 🚀",
  "Hey legend! Ready to build something amazing today? 💡",
  "You're back! Your ideas missed you 😄 Let's go!",
  "Welcome back! Remember — every great startup started with one login 🔥",
];

/**
 * Fetch everything the guide bot needs in one server call.
 * Groq is used only for the welcome-back quote — tour messages are static on the client.
 */
export async function fetchGuideContext(): Promise<GuideContext | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [profileRes, startupRes, missionsRes, notifRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, bio, skills, role, streak_count")
        .eq("id", user.id)
        .single(),
      supabase
        .from("startups")
        .select("stage")
        .eq("student_id", user.id)
        .maybeSingle(),
      supabase
        .from("missions")
        .select("id", { count: "exact", head: true })
        .eq("student_id", user.id)
        .eq("is_completed", false)
        .gte("expires_at", today.toISOString()),
      supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false),
    ]);

    const profile = profileRes.data;
    if (!profile) return null;

    const profileCompleted = !!(
      profile.full_name &&
      profile.bio &&
      profile.skills &&
      profile.skills.length > 0
    );

    // Generate welcome-back quote via Groq (best-effort)
    let welcomeQuote =
      FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)];
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: WELCOME_PROMPT },
          {
            role: "user",
            content: JSON.stringify({
              name: profile.full_name ?? "Innovator",
              streak: profile.streak_count ?? 0,
            }),
          },
        ],
        max_tokens: 100,
        temperature: 0.9,
      });
      const raw = completion.choices[0]?.message?.content;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.quote) welcomeQuote = parsed.quote;
      }
    } catch {
      // Groq unavailable — keep fallback
    }

    return {
      userId: user.id,
      profileCompleted,
      startupStage: startupRes.data?.stage ?? null,
      pendingMissions: missionsRes.count ?? 0,
      notificationCount: notifRes.count ?? 0,
      streak: profile.streak_count ?? 0,
      fullName: profile.full_name ?? "Innovator",
      welcomeQuote,
    };
  } catch {
    return null;
  }
}
