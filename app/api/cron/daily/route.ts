import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendMissionReminder } from "@/app/actions/notifications";
import { checkStreakWarnings } from "@/lib/gamification/streak";

/**
 * Daily cron job endpoint
 * Should be called once per day (e.g., via Vercel Cron or external scheduler)
 *
 * Tasks:
 * 1. Send mission reminders to all active students
 * 2. Check and send streak warnings to users at risk
 *
 * Protect this endpoint with a secret token in production
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (optional but recommended)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();

  // Get all active students
  const { data: students } = await supabase
    .from("profiles")
    .select("id, email, full_name")
    .eq("role", "student");

  if (!students) {
    return NextResponse.json({ error: "No students found" }, { status: 404 });
  }

  let missionRemindersSent = 0;
  let streakWarningsSent = 0;

  // Send mission reminders to all students
  for (const student of students) {
    try {
      await sendMissionReminder(student.id);
      missionRemindersSent++;
    } catch (error) {
      console.error(`Failed to send mission reminder to ${student.id}:`, error);
    }
  }

  // Check streak warnings
  try {
    await checkStreakWarnings();
    // Note: checkStreakWarnings doesn't return count, so we estimate
    streakWarningsSent = students.length;
  } catch (error) {
    console.error("Failed to check streak warnings:", error);
  }

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    missionRemindersSent,
    streakWarningsChecked: students.length,
  });
}
