"use server";

import { createClient } from "@/lib/supabase/server";

export type Platform = "linkedin" | "whatsapp" | "email";

interface BroadcastResult {
  platform: Platform;
  success: boolean;
  error?: string;
}

export interface BroadcastResponse {
  results: BroadcastResult[];
}

/**
 * Server action: broadcast a post to selected platforms via their APIs.
 */
export async function broadcastPost(
  text: string,
  platforms: Platform[],
): Promise<BroadcastResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  if (!text.trim()) throw new Error("Post content cannot be empty");
  if (platforms.length === 0) throw new Error("Select at least one platform");

  const results: BroadcastResult[] = await Promise.allSettled(
    platforms.map((p) => dispatchToPlatform(p, text, user.id)),
  ).then((outcomes) =>
    outcomes.map((outcome, i) =>
      outcome.status === "fulfilled"
        ? outcome.value
        : {
            platform: platforms[i],
            success: false,
            error:
              outcome.reason instanceof Error
                ? outcome.reason.message
                : "Unknown error",
          },
    ),
  );

  return { results };
}

// ── Per-platform dispatch ───────────────────────────────────────────────

async function dispatchToPlatform(
  platform: Platform,
  text: string,
  userId: string,
): Promise<BroadcastResult> {
  switch (platform) {
    case "email":
      return sendViaEmail(text);
    case "linkedin":
      return postToLinkedIn(text, userId);
    case "whatsapp":
      return sendViaWhatsApp(text);
  }
}

// ── Email via Resend ────────────────────────────────────────────────────

async function sendViaEmail(text: string): Promise<BroadcastResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      platform: "email",
      success: false,
      error: "RESEND_API_KEY is not configured",
    };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "INNOVEX <noreply@innovex.app>",
      to: [process.env.BROADCAST_EMAIL_TO ?? "community@innovex.app"],
      subject: "INNOVEX Achievement Update",
      text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return {
      platform: "email",
      success: false,
      error: `Resend API error: ${res.status} – ${body}`,
    };
  }

  return { platform: "email", success: true };
}

// ── LinkedIn UGC Post API ───────────────────────────────────────────────

async function postToLinkedIn(
  text: string,
  userId: string,
): Promise<BroadcastResult> {
  const supabase = await createClient();

  // Retrieve the user's stored LinkedIn OAuth access token
  const { data: token } = await supabase
    .from("oauth_tokens")
    .select("access_token")
    .eq("user_id", userId)
    .eq("provider", "linkedin")
    .single();

  if (!token?.access_token) {
    return {
      platform: "linkedin",
      success: false,
      error:
        "LinkedIn account not connected – please link your account in Settings",
    };
  }

  // Fetch the user's LinkedIn URN (person identifier)
  const meRes = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (!meRes.ok) {
    return {
      platform: "linkedin",
      success: false,
      error: "Failed to retrieve LinkedIn profile",
    };
  }
  const me = await meRes.json();
  const personUrn = `urn:li:person:${me.sub}`;

  // Create UGC post
  const postRes = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: personUrn,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    }),
  });

  if (!postRes.ok) {
    const body = await postRes.text();
    return {
      platform: "linkedin",
      success: false,
      error: `LinkedIn API error: ${postRes.status} – ${body}`,
    };
  }

  return { platform: "linkedin", success: true };
}

// ── WhatsApp Cloud API ──────────────────────────────────────────────────

async function sendViaWhatsApp(text: string): Promise<BroadcastResult> {
  const apiToken = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const recipientNumber = process.env.WHATSAPP_BROADCAST_NUMBER;

  if (!apiToken || !phoneNumberId) {
    return {
      platform: "whatsapp",
      success: false,
      error: "WhatsApp Cloud API credentials are not configured",
    };
  }

  if (!recipientNumber) {
    return {
      platform: "whatsapp",
      success: false,
      error: "WHATSAPP_BROADCAST_NUMBER is not configured",
    };
  }

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: recipientNumber,
        type: "text",
        text: { body: text },
      }),
    },
  );

  if (!res.ok) {
    const body = await res.text();
    return {
      platform: "whatsapp",
      success: false,
      error: `WhatsApp API error: ${res.status} – ${body}`,
    };
  }

  return { platform: "whatsapp", success: true };
}
