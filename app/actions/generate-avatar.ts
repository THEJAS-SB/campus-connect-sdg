"use server";

import Replicate from "replicate";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface GenerateAvatarResult {
  success: true;
  avatarUrl: string;
}

export interface GenerateAvatarError {
  success: false;
  error: string;
}

export type GenerateAvatarResponse = GenerateAvatarResult | GenerateAvatarError;

/* ------------------------------------------------------------------ */
/*  Replicate client (singleton at module level – safe in Node.js)      */
/* ------------------------------------------------------------------ */

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

/* ------------------------------------------------------------------ */
/*  Server Action                                                        */
/* ------------------------------------------------------------------ */

/**
 * generateAvatar
 *
 * Accepts a base64-encoded image (with or without a data-URI prefix) from
 * the client, runs it through the Replicate flux-kontext-pro model to produce
 * a 3D Pixar-style cartoon avatar, persists the resulting URL to the user's
 * `profiles.avatar_url` column, and returns the URL to the caller.
 *
 * The caller is responsible for persisting the URL in localStorage for
 * fast, offline-friendly re-display without an additional Supabase round-trip.
 */
export async function generateAvatar(
  base64Image: string,
): Promise<GenerateAvatarResponse> {
  // ── Auth guard ──────────────────────────────────────────────────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "You must be signed in to generate an avatar.",
    };
  }

  // ── Validate input ──────────────────────────────────────────────────
  if (!base64Image || base64Image.length < 100) {
    return { success: false, error: "Invalid image data received." };
  }

  // Ensure proper data-URI prefix so Replicate accepts it
  const dataUri = base64Image.startsWith("data:")
    ? base64Image
    : `data:image/jpeg;base64,${base64Image}`;

  // ── Call Replicate ──────────────────────────────────────────────────
  try {
    const input = {
      prompt:
        "Transform this portrait into a 3D stylized Pixar-style clean avatar. " +
        "Smooth glossy render, vibrant cartoon colours, expressive eyes, " +
        "clean solid background, high quality character illustration, " +
        "digital art, trending on artstation",
      input_image: dataUri,
      output_format: "jpg",
    };

    const output = await replicate.run("black-forest-labs/flux-kontext-pro", {
      input,
    });

    // ── Normalise the output to a URL string ────────────────────────
    // flux-kontext-pro returns a single FileOutput whose .url() gives
    // the downloadable URL; handle edge cases gracefully.
    let avatarUrl: string;

    if (!output) {
      throw new Error("The AI model returned no output.");
    } else if (typeof output === "string") {
      avatarUrl = output;
    } else if (
      typeof output === "object" &&
      "url" in output &&
      typeof (output as { url: unknown }).url === "function"
    ) {
      // FileOutput shape
      avatarUrl = String((output as { url: () => URL | string }).url());
    } else if (Array.isArray(output) && output.length > 0) {
      const first = output[0];
      avatarUrl =
        typeof first === "string"
          ? first
          : String((first as { url: () => URL | string }).url());
    } else {
      throw new Error("Unexpected output format from the AI model.");
    }

    if (!avatarUrl || !avatarUrl.startsWith("http")) {
      throw new Error("The AI model returned an invalid URL.");
    }

    // ── Persist to Supabase profiles ────────────────────────────────
    const { error: dbError } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", user.id);

    if (dbError) {
      // Non-fatal: return the URL so the client can still cache it locally
      console.warn("[generateAvatar] profile update skipped:", dbError.message);
    }

    revalidatePath("/student/profile");
    revalidatePath("/student");

    return { success: true, avatarUrl };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Avatar generation failed.";
    console.error("[generateAvatar]", message);
    return { success: false, error: message };
  }
}
