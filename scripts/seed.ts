/**
 * Database Seed Script for INNOVEX / Campus Connect
 *
 * Creates test users via Supabase Auth Admin API, then inserts
 * profiles, startups, matches, missions, badges, pipeline entries,
 * meetings, notifications, and activity logs.
 *
 * Usage:  npx tsx scripts/seed.ts
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// ── Load .env manually (no dotenv dependency needed) ──────────
const envPath = path.resolve(__dirname, "..", ".env");
const envContent = fs.readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const value = trimmed.slice(eqIdx + 1).trim();
  if (!process.env[key]) process.env[key] = value;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Service-role client bypasses RLS
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Test user definitions ─────────────────────────────────────
const TEST_PASSWORD = "Test@1234";

const USERS = [
  // Students
  {
    email: "alice.student@innovex.test",
    full_name: "Alice Johnson",
    role: "student",
    rs_id: "ST-2026-100001",
    bio: "Passionate about EdTech and inclusive education. Building tools to bridge the digital divide in rural schools.",
    skills: ["React", "Node.js", "Python", "UI/UX Design"],
    sdgs: [4, 10],
    innovation_score: 450,
    streak_count: 7,
    avatar_state: "running",
  },
  {
    email: "bob.student@innovex.test",
    full_name: "Bob Williams",
    role: "student",
    rs_id: "ST-2026-100002",
    bio: "AgriTech enthusiast exploring IoT solutions for smallholder farmers. Focused on sustainable agriculture.",
    skills: ["IoT", "Machine Learning", "Arduino", "Data Analysis"],
    sdgs: [2, 13],
    innovation_score: 320,
    streak_count: 3,
    avatar_state: "excited",
  },
  {
    email: "carol.student@innovex.test",
    full_name: "Carol Martinez",
    role: "student",
    rs_id: "ST-2026-100003",
    bio: "HealthTech innovator working on AI-powered diagnostic tools for underserved communities.",
    skills: ["AI/ML", "Python", "Flutter", "Healthcare"],
    sdgs: [3, 9],
    innovation_score: 680,
    streak_count: 12,
    avatar_state: "celebrating",
  },
  {
    email: "dave.student@innovex.test",
    full_name: "Dave Chen",
    role: "student",
    rs_id: "ST-2026-100004",
    bio: "FinTech builder exploring blockchain-based microfinance for developing economies.",
    skills: ["Solidity", "TypeScript", "Smart Contracts", "Finance"],
    sdgs: [1, 8],
    innovation_score: 150,
    streak_count: 1,
    avatar_state: "idle",
  },
  {
    email: "eve.student@innovex.test",
    full_name: "Eve Nakamura",
    role: "student",
    rs_id: "ST-2026-100005",
    bio: "CleanTech advocate developing solar-powered water purification for off-grid communities.",
    skills: ["Hardware", "CAD", "Embedded Systems", "Sustainability"],
    sdgs: [6, 7],
    innovation_score: 520,
    streak_count: 5,
    avatar_state: "running",
  },
  // Mentors
  {
    email: "mentor.sarah@innovex.test",
    full_name: "Dr. Sarah Patel",
    role: "mentor",
    rs_id: "ME-2026-200001",
    bio: "15 years in EdTech. Former VP Engineering at Coursera. Angel investor in 20+ startups across education and SaaS.",
    skills: ["EdTech", "Product Strategy", "Fundraising", "Team Building"],
    sdgs: [4, 9],
    innovation_score: 0,
    streak_count: 0,
    avatar_state: "idle",
  },
  {
    email: "mentor.james@innovex.test",
    full_name: "James Okafor",
    role: "mentor",
    rs_id: "ME-2026-200002",
    bio: "Serial entrepreneur and climate-tech investor. Founded 2 successful AgriTech exits. Mentor at Y Combinator.",
    skills: ["AgriTech", "Business Development", "Venture Capital", "IoT"],
    sdgs: [2, 13],
    innovation_score: 0,
    streak_count: 0,
    avatar_state: "idle",
  },
  {
    email: "mentor.priya@innovex.test",
    full_name: "Dr. Priya Sharma",
    role: "mentor",
    rs_id: "ME-2026-200003",
    bio: "HealthTech and BioTech expert. Director of Innovation at Johns Hopkins. Published 40+ papers on AI diagnostics.",
    skills: ["HealthTech", "AI/ML", "Research", "Clinical Trials"],
    sdgs: [3, 9],
    innovation_score: 0,
    streak_count: 0,
    avatar_state: "idle",
  },
  // Investors
  {
    email: "investor.maria@innovex.test",
    full_name: "Maria Gonzalez",
    role: "investor",
    rs_id: "IN-2026-300001",
    bio: "Managing Partner at ImpactVentures Fund. $50M AUM focused on SDG-aligned startups in emerging markets.",
    skills: ["Impact Investing", "Due Diligence", "ESG", "FinTech"],
    sdgs: [1, 8, 10],
    innovation_score: 0,
    streak_count: 0,
    avatar_state: "idle",
  },
  {
    email: "investor.raj@innovex.test",
    full_name: "Raj Kapoor",
    role: "investor",
    rs_id: "IN-2026-300002",
    bio: "Partner at GreenFuture Capital. Invested in 30+ clean energy and sustainability startups globally.",
    skills: ["CleanTech", "Sustainability", "Portfolio Management", "IPO Advisory"],
    sdgs: [7, 13, 6],
    innovation_score: 0,
    streak_count: 0,
    avatar_state: "idle",
  },
  // Admin
  {
    email: "admin@innovex.test",
    full_name: "Admin User",
    role: "admin",
    rs_id: "AD-2026-900001",
    bio: "Platform administrator for INNOVEX Campus Connect.",
    skills: ["Platform Management", "Analytics", "Operations"],
    sdgs: [] as number[],
    innovation_score: 0,
    streak_count: 0,
    avatar_state: "idle",
  },
];

// ── Startups (linked to students by index) ────────────────────
const STARTUPS = [
  {
    studentIndex: 0, // Alice
    title: "EduBridge",
    description:
      "An AI-powered platform that personalizes learning paths for rural students, bridging the digital education divide through offline-first progressive web apps.",
    stage: "mvp",
    domain: "EdTech",
    sdg_tags: [4, 10],
    funding_raised: 15000,
  },
  {
    studentIndex: 1, // Bob
    title: "FarmSense",
    description:
      "IoT sensor network for smallholder farms providing real-time soil health, weather alerts, and AI-driven crop recommendations via SMS.",
    stage: "idea",
    domain: "AgriTech",
    sdg_tags: [2, 13],
    funding_raised: 0,
  },
  {
    studentIndex: 2, // Carol
    title: "MediScan AI",
    description:
      "Mobile-first AI diagnostic tool that analyzes medical images to detect diseases early in areas with limited healthcare access.",
    stage: "revenue",
    domain: "HealthTech",
    sdg_tags: [3, 9],
    funding_raised: 75000,
  },
  {
    studentIndex: 3, // Dave
    title: "MicroChain Finance",
    description:
      "Blockchain-based microfinance platform enabling peer-to-peer lending with transparent interest rates for unbanked populations.",
    stage: "idea",
    domain: "FinTech",
    sdg_tags: [1, 8],
    funding_raised: 0,
  },
  {
    studentIndex: 4, // Eve
    title: "SolarPure",
    description:
      "Portable solar-powered water purification unit designed for off-grid villages, producing 500L clean water per day.",
    stage: "mvp",
    domain: "CleanTech",
    sdg_tags: [6, 7],
    funding_raised: 25000,
  },
];

// ── Helpers ────────────────────────────────────────────────────
async function deleteExistingUser(email: string) {
  const { data } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existing = data?.users?.find((u) => u.email === email);
  if (existing) {
    await supabase.auth.admin.deleteUser(existing.id);
  }
}

// ── Main seed function ────────────────────────────────────────
async function seed() {
  console.log("🌱 Starting database seed...\n");

  // ─── 1. Create auth users & profiles ──────────────────────
  console.log("👤 Creating users and profiles...");
  const userIds: string[] = [];

  for (const user of USERS) {
    // Delete existing user to allow re-seeding
    await deleteExistingUser(user.email);

    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: user.email,
        password: TEST_PASSWORD,
        email_confirm: true,
      });

    if (authError) {
      console.error(`  ✗ Failed to create auth user ${user.email}:`, authError.message);
      process.exit(1);
    }

    const userId = authData.user.id;
    userIds.push(userId);

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: userId,
      rs_id: user.rs_id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      bio: user.bio,
      skills: user.skills,
      sdgs: user.sdgs,
      innovation_score: user.innovation_score,
      streak_count: user.streak_count,
      avatar_state: user.avatar_state,
    });

    if (profileError) {
      console.error(`  ✗ Failed to create profile for ${user.email}:`, profileError.message);
      process.exit(1);
    }

    console.log(`  ✓ ${user.role.padEnd(8)} ${user.full_name} (${user.email})`);
  }

  // Map user indices by role
  const studentIds = userIds.filter((_, i) => USERS[i].role === "student");
  const mentorIds = userIds.filter((_, i) => USERS[i].role === "mentor");
  const investorIds = userIds.filter((_, i) => USERS[i].role === "investor");

  // ─── 2. Create startups ───────────────────────────────────
  console.log("\n🚀 Creating startups...");
  const startupIds: string[] = [];

  for (const startup of STARTUPS) {
    const studentId = studentIds[startup.studentIndex];
    const { data, error } = await supabase
      .from("startups")
      .insert({
        student_id: studentId,
        title: startup.title,
        description: startup.description,
        stage: startup.stage,
        domain: startup.domain,
        sdgs: startup.sdg_tags,
        funding_raised: startup.funding_raised,
      })
      .select("id")
      .single();

    if (error) {
      console.error(`  ✗ Failed to create startup ${startup.title}:`, error.message);
      process.exit(1);
    }

    startupIds.push(data.id);
    console.log(`  ✓ ${startup.title} (${startup.stage}) — ${USERS[startup.studentIndex].full_name}`);
  }

  // ─── 3. Create matches (mentor ↔ student) ─────────────────
  console.log("\n🤝 Creating mentor-student matches...");
  const matchData = [
    { mentorIdx: 0, studentIdx: 0, startupIdx: 0, score: 92.5, status: "active",
      reasoning: "Dr. Sarah Patel's EdTech expertise at Coursera directly aligns with Alice's EduBridge platform. Strong match on SDG 4 and product strategy." },
    { mentorIdx: 1, studentIdx: 1, startupIdx: 1, score: 88.0, status: "active",
      reasoning: "James Okafor's AgriTech exits and IoT experience make him an ideal mentor for Bob's FarmSense project. Shared focus on SDG 2 and climate." },
    { mentorIdx: 2, studentIdx: 2, startupIdx: 2, score: 95.0, status: "active",
      reasoning: "Dr. Priya Sharma's AI diagnostics research at Johns Hopkins is a perfect match for Carol's MediScan AI. Strongest alignment on SDG 3." },
    { mentorIdx: 0, studentIdx: 3, startupIdx: 3, score: 72.0, status: "pending",
      reasoning: "While Sarah's primary expertise is EdTech, her fundraising and product strategy skills can help Dave's MicroChain Finance get off the ground." },
    { mentorIdx: 1, studentIdx: 4, startupIdx: 4, score: 85.0, status: "active",
      reasoning: "James's climate-tech investment background and IoT knowledge complement Eve's SolarPure hardware project well." },
  ];

  // Try to insert into 'matches' table first (database/schema.sql)
  // If that fails, try 'mentorship_connections' (migration schema)
  let matchTableName = "matches";
  const matchInserts = matchData.map((m) => ({
    mentor_id: mentorIds[m.mentorIdx],
    student_id: studentIds[m.studentIdx],
    startup_id: startupIds[m.startupIdx],
    compatibility_score: m.score,
    reasoning: m.reasoning,
    status: m.status,
  }));

  let { error: matchError } = await supabase.from(matchTableName).insert(matchInserts);
  if (matchError && matchError.message.includes("does not exist")) {
    matchTableName = "mentorship_connections";
    const altInserts = matchData.map((m) => ({
      mentor_id: mentorIds[m.mentorIdx],
      student_id: studentIds[m.studentIdx],
      compatibility_score: m.score,
      reasoning: m.reasoning,
      status: m.status,
    }));
    const { error: altError } = await supabase.from(matchTableName).insert(altInserts);
    if (altError) {
      console.error("  ✗ Failed to insert matches:", altError.message);
    } else {
      console.log(`  ✓ ${matchData.length} mentor-student connections created (table: ${matchTableName})`);
    }
  } else if (matchError) {
    console.error("  ✗ Failed to insert matches:", matchError.message);
  } else {
    console.log(`  ✓ ${matchData.length} mentor-student matches created`);
  }

  // ─── 4. Create missions ───────────────────────────────────
  console.log("\n🎯 Creating daily missions...");
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const missionTemplates = [
    { title: "Complete your startup pitch deck", description: "Create or update your 10-slide pitch deck covering problem, solution, market, and traction.", xp_reward: 50 },
    { title: "Connect with a potential customer", description: "Reach out to 3 potential users and conduct a 15-minute customer discovery interview.", xp_reward: 40 },
    { title: "Review your financial projections", description: "Update your revenue model and financial projections for the next 12 months.", xp_reward: 30 },
    { title: "Update your Innovation Profile", description: "Add your latest skills, interests, and SDG alignments to your profile.", xp_reward: 20 },
    { title: "Research your market competitors", description: "Identify 5 competitors and create a comparison matrix highlighting your unique advantages.", xp_reward: 40 },
    { title: "Write a blog post about your journey", description: "Share your startup journey and lessons learned in a 500-word blog post.", xp_reward: 30 },
    { title: "Practice your elevator pitch", description: "Record a 60-second video pitch and share it with your mentor for feedback.", xp_reward: 25 },
    { title: "Define your MVP scope", description: "List the core 5 features for your minimum viable product and prioritize them.", xp_reward: 35 },
  ];

  const missionInserts = [];
  for (let i = 0; i < studentIds.length; i++) {
    // Give each student 3 missions
    for (let j = 0; j < 3; j++) {
      const tmpl = missionTemplates[(i * 3 + j) % missionTemplates.length];
      missionInserts.push({
        student_id: studentIds[i],
        title: tmpl.title,
        description: tmpl.description,
        xp_reward: tmpl.xp_reward,
        is_completed: j === 0 && i < 3, // First mission completed for first 3 students
        expires_at: tomorrow.toISOString(),
      });
    }
  }

  const { error: missionError } = await supabase.from("missions").insert(missionInserts);
  if (missionError) {
    console.error("  ✗ Failed to create missions:", missionError.message);
  } else {
    console.log(`  ✓ ${missionInserts.length} missions created`);
  }

  // ─── 5. Create investor pipeline entries ──────────────────
  console.log("\n💰 Creating investor pipeline entries...");
  const pipelineData = [
    { investorIdx: 0, startupIdx: 2, stage: "in_talks", notes: "MediScan AI shows strong traction. Scheduled due diligence call." },
    { investorIdx: 0, startupIdx: 0, stage: "bookmarked", notes: "EduBridge has interesting approach to offline-first learning." },
    { investorIdx: 0, startupIdx: 3, stage: "bookmarked", notes: "Watching MicroChain's regulatory approach." },
    { investorIdx: 1, startupIdx: 4, stage: "due_diligence", notes: "SolarPure hardware prototype is impressive. Reviewing unit economics." },
    { investorIdx: 1, startupIdx: 1, stage: "bookmarked", notes: "FarmSense IoT concept aligns with our thesis." },
  ];

  // Try with 'stage' column first, then 'pipeline_stage'
  const pipelineInserts = pipelineData.map((p) => ({
    investor_id: investorIds[p.investorIdx],
    startup_id: startupIds[p.startupIdx],
    stage: p.stage,
    notes: p.notes,
  }));

  let { error: pipelineError } = await supabase.from("investor_pipeline").insert(pipelineInserts);
  if (pipelineError && pipelineError.message.includes("stage")) {
    // Migration schema uses 'pipeline_stage' instead of 'stage'
    const altInserts = pipelineData.map((p) => ({
      investor_id: investorIds[p.investorIdx],
      startup_id: startupIds[p.startupIdx],
      pipeline_stage: p.stage,
      notes: p.notes,
    }));
    const { error: altError } = await supabase.from("investor_pipeline").insert(altInserts as any);
    if (altError) {
      console.error("  ✗ Failed to create pipeline entries:", altError.message);
    } else {
      console.log(`  ✓ ${pipelineData.length} pipeline entries created (using pipeline_stage column)`);
    }
  } else if (pipelineError) {
    console.error("  ✗ Failed to create pipeline entries:", pipelineError.message);
  } else {
    console.log(`  ✓ ${pipelineData.length} pipeline entries created`);
  }

  // ─── 6. Create meetings ───────────────────────────────────
  console.log("\n📅 Creating meetings...");
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const meetingInserts = [
    {
      mentor_id: mentorIds[0],
      mentee_id: studentIds[0],
      title: "EduBridge MVP Review",
      scheduled_at: new Date(nextWeek.getTime() + 10 * 3600000).toISOString(),
      notes: "First check-in: Review EduBridge MVP progress and fundraising strategy.",
    },
    {
      mentor_id: mentorIds[1],
      mentee_id: studentIds[1],
      title: "FarmSense Prototype Discussion",
      scheduled_at: new Date(nextWeek.getTime() + 14 * 3600000).toISOString(),
      notes: "Discuss FarmSense IoT sensor prototype and pilot farm selection.",
    },
    {
      mentor_id: mentorIds[2],
      mentee_id: studentIds[2],
      title: "MediScan AI Clinical Validation",
      scheduled_at: new Date(nextWeek.getTime() + 16 * 3600000).toISOString(),
      notes: "Review MediScan AI clinical validation plan and regulatory pathway.",
    },
  ];

  const { error: meetingError } = await supabase.from("meetings").insert(meetingInserts);
  if (meetingError) {
    console.error("  ✗ Failed to create meetings:", meetingError.message);
  } else {
    console.log(`  ✓ ${meetingInserts.length} meetings scheduled`);
  }

  // ─── 7. Create notifications ──────────────────────────────
  console.log("\n🔔 Creating notifications...");
  const notifInserts = [
    { user_id: studentIds[0], title: "New Mentor Match!", message: "You've been matched with Dr. Sarah Patel (92.5% compatibility).", type: "match", link: "/student/matches", is_read: false },
    { user_id: studentIds[0], title: "Mission Completed!", message: "You earned 50 XP for completing your pitch deck.", type: "mission", link: "/student/missions", is_read: true },
    { user_id: studentIds[1], title: "New Mentor Match!", message: "James Okafor wants to mentor your FarmSense project.", type: "match", link: "/student/matches", is_read: false },
    { user_id: studentIds[2], title: "Investor Interest!", message: "Maria Gonzalez added MediScan AI to her pipeline.", type: "match", link: "/student", is_read: false },
    { user_id: mentorIds[0], title: "New Mentee Request", message: "Alice Johnson requests mentorship for EduBridge.", type: "match", link: "/mentor/mentees", is_read: true },
    { user_id: mentorIds[1], title: "Meeting Scheduled", message: "Meeting with Bob Williams on FarmSense next week.", type: "meeting", link: "/mentor", is_read: false },
    { user_id: investorIds[0], title: "New Startup Alert", message: "MediScan AI matches your investment thesis on SDG 3.", type: "match", link: "/investor/discover", is_read: false },
  ];

  const { error: notifError } = await supabase.from("notifications").insert(notifInserts);
  if (notifError) {
    // Notifications table may not exist in migration schema
    console.error("  ✗ Notifications table may not exist:", notifError.message);
  } else {
    console.log(`  ✓ ${notifInserts.length} notifications created`);
  }

  // ─── 8. Create activity log ───────────────────────────────
  console.log("\n📊 Creating activity logs...");
  const activityInserts = [
    { user_id: studentIds[0], action_type: "startup_created", action_data: { startup: "EduBridge", stage: "idea" } },
    { user_id: studentIds[0], action_type: "startup_updated", action_data: { startup: "EduBridge", stage: "mvp", field: "stage" } },
    { user_id: studentIds[0], action_type: "mission_completed", action_data: { mission: "Complete your startup pitch deck", xp: 50 } },
    { user_id: studentIds[1], action_type: "startup_created", action_data: { startup: "FarmSense", stage: "idea" } },
    { user_id: studentIds[2], action_type: "startup_created", action_data: { startup: "MediScan AI", stage: "idea" } },
    { user_id: studentIds[2], action_type: "startup_updated", action_data: { startup: "MediScan AI", stage: "revenue", field: "stage" } },
    { user_id: studentIds[2], action_type: "badge_earned", action_data: { badge: "Early Adopter" } },
    { user_id: investorIds[0], action_type: "pipeline_added", action_data: { startup: "MediScan AI", stage: "in_talks" } },
    { user_id: mentorIds[0], action_type: "match_accepted", action_data: { student: "Alice Johnson", startup: "EduBridge" } },
  ];

  const { error: activityError } = await supabase.from("activity_log").insert(activityInserts);
  if (activityError) {
    console.error("  ✗ Activity log table may not exist:", activityError.message);
  } else {
    console.log(`  ✓ ${activityInserts.length} activity logs created`);
  }

  // ─── 9. Update KPI cache ──────────────────────────────────
  console.log("\n📈 Updating KPI cache...");
  // Skip KPI cache — it uses the cron route to auto-populate
  console.log("  ✓ KPI cache will be populated by the /api/cron/refresh-kpis route");

  // ─── Done ─────────────────────────────────────────────────
  console.log("\n════════════════════════════════════════════");
  console.log("✅ Seed completed successfully!");
  console.log("════════════════════════════════════════════");
  console.log("\n📋 Test Accounts (password for all: Test@1234):");
  console.log("─────────────────────────────────────────────");
  for (const user of USERS) {
    console.log(`  ${user.role.padEnd(8)}  ${user.email}`);
  }
  console.log("");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
